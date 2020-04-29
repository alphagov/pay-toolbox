import crypto from 'crypto'
import { Request, Response } from 'express'
import { parseString } from 'fast-csv'
import { Parser } from 'json2csv'
import { S3, ECS } from 'aws-sdk'
import moment from 'moment'
import logger from '../../../../lib/logger'
import { aws, common } from '../../../../config'

type TransactionRow = {
  transaction_id: string;
  transaction_type: string;
  event_name: string;
  event_date: string;
  parent_transaction_id: string;
  reason: string;
  admin_github_id: string;
}

export async function fileUpload(req: Request, res: Response): Promise<void> {
  res.render('transactions/update/upload.njk', {
    csrf: req.csrfToken(),
    messages: req.flash('info'),
    errors: req.flash('error')
  })
}

export async function updateSuccess(req: Request, res: Response): Promise<void> {
  if (!req.session.updateTransactionJobId) {
    req.flash('error', 'Job ID not found on current session')
    res.redirect('/transactions/update')
    return
  }
  const context = { jobId: req.session.updateTransactionJobId }
  delete req.session.updateTransactionJobId
  res.render('transactions/update/success', context)
}

const uploadToS3 = async function uploadToS3(content: string, user: any): Promise<string> {
  // The AWS SDK automatically uses the AWS credentials from the environment when deployed.
  // For local testing, set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables.
  try {
    const s3 = new S3()
    const key = (user && user.username || '') + moment().format('x')
    logger.info(`Uploading transactions file to S3 with key ${key}`)
    const response = await s3.putObject({
      Bucket: aws.AWS_S3_UPDATE_TRANSACTIONS_BUCKET_NAME,
      Body: content,
      Key: key,
      ServerSideEncryption: 'AES256'
    }).promise();
    logger.info('Upload to S3 completed', {
      fileVersionId: response.VersionId,
      fileExpiration: response.Expiration
    })
    return key
  } catch (err) {
    logger.error(`Error uploading to s3: ${err.message}`)
    throw new Error('There was an error uploading the file to S3')
  }
}

const runEcsTask = async function runEcsTask(fileKey: string, jobId: string): Promise<string> {
  try {
    const ecs = new ECS()
    const response = await ecs.runTask({
      taskDefinition: aws.AWC_ECS_UPDATE_TRANSACTIONS_TASK_DEFINITION,
      cluster: common.ENVIRONMENT,
      overrides: {
        containerOverrides: [
          {
            name: 'stream-s3-sqs',
            environment: [
              { name: 'PROVIDER_S3_SOURCE_FILE', value: fileKey },
              { name: 'JOB_ID', value: jobId }
            ]
          }
        ]
      }
    }).promise()
    logger.info('Run ECS task completed', {
      numberOfFailures: response.failures.length,
      numberOfTasksStarted: response.tasks.length
    })
    if (!response.tasks || response.tasks.length < 1) {
      throw new Error('No task data returned in ECS run task response')
    }
    return response.tasks[0].containers[0].runtimeId
  } catch (err) {
    logger.error(`Error running ECS task: ${err.message}`)
    throw new Error('There was an error starting the update transactions task')
  }
}

const formatSessionUserIdentifier = function formatSessionUserIdentifier(user: any) {
  if (!user) {
    return '(No Toolbox user session)'
  } else if (!user.displayName) {
    return user.username
  } else {
    return `${user.displayName} (${user.username})`
  }
}

const validateAndAddDefaults = async function validateAndAddDefaults(csv: string, user: any): Promise<Object[]> {
  let validationError = false
  const data: Object[] = []

  return new Promise((resolve, reject) => {
    parseString<TransactionRow, TransactionRow>(csv, {
      headers: headers => headers.map(h => h?.trim())
    })
      .transform((row: TransactionRow) => {
        if (row.event_date) {
          if (moment(row.event_date, moment.ISO_8601).isValid()) {
            row.event_date = `${moment(row.event_date, moment.ISO_8601).utc().format('YYYY-MM-DDTHH:mm:ss.SSSSSS')}Z`
          }
        } else {
          row.event_date = `${moment().utc().format('YYYY-MM-DDTHH:mm:ss.SSSSSS')}Z`
        }
        if (!row.transaction_type) {
          row.transaction_type = 'payment'
        }
        return row
      })
      .validate((row, cb) => {
        if (!row.transaction_id) {
          return cb(null, false, 'transaction_id is missing')
        }
        if (!row.event_name) {
          return cb(null, false, 'event_name is missing')
        }
        if (!row.reason) {
          return cb(null, false, 'reason is missing')
        }

        row.admin_github_id = formatSessionUserIdentifier(user)

        if (!moment(row.event_date, moment.ISO_8601).isValid()) {
          return cb(null, false, 'event_date is not a valid ISO_8601 string')
        }
        if (!['payment', 'refund'].includes(row.transaction_type)) {
          return cb(null, false, 'transaction_type must be one of \'payment\' or \'refund\'')
        }
        if (row.transaction_type === 'refund' && !row.parent_transaction_id) {
          return cb(null, false, 'parent_transaction_id is required when transaction_type is \'refund\'')
        }
        return cb(null, true)
      })
      .on('error', error => {
        reject(new Error(`There was an error parsing the csv: ${error.message}`))
      })
      .on('data', row => {
        data.push(row)
      })
      .on('data-invalid', (row, rowNumber, reason) => {
        validationError = true
        reject(new Error(`CSV invalid on row ${rowNumber}: ${reason}`))
      })
      .on('end', (rowCount: number) => {
        if (!validationError) {
          logger.info(`Successfully parsed transactions update CSV: ${rowCount} rows`)
          resolve(data)
        }
      })
  })
}

export async function update(req: Request, res: Response): Promise<void> {
  if (!req.file || !req.file.buffer) {
    req.flash('error', 'Select a CSV containing transaction updates')
    return res.redirect('/transactions/update')
  }

  try {
    const data = await validateAndAddDefaults(req.file.buffer.toLocaleString(), req.user)
    const parser = new Parser()
    const jobId = crypto.randomBytes(4).toString('hex')
    const output = parser.parse(data)
    const fileKey = await uploadToS3(output, req.user)
    await runEcsTask(fileKey, jobId)
    req.session.updateTransactionJobId = jobId
    res.redirect('/transactions/update/success')
  } catch (err) {
    logger.warn('Error updating transactions', {
      message: err.message,
      filename: req.file && req.file.filename
    })
    req.flash('error', err.message)
    res.redirect('/transactions/update')
  }
}