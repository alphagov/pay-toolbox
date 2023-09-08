import crypto from 'crypto'
import { Request, Response } from 'express'
import { parseString } from 'fast-csv'
import { Parser } from 'json2csv'
import { S3 } from '@aws-sdk/client-s3'
import { ECS } from '@aws-sdk/client-ecs'
import moment from 'moment'
import logger from '../../../../lib/logger'
import { aws, common } from '../../../../config'

type TransactionRow = {
  transaction_id: string;
  transaction_type: string;
  event_name: string;
  event_date: string;
  parent_transaction_id: string;
  updated_reason: string;
  admin_github_id: string;
  captured_date?: string,
  refund_status?: string,
  refund_amount_refunded?: string,
  refund_amount_available?: string,
  reproject_domain_object?: string,
  requires_3ds?: boolean,
  reason?: string
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
    const s3 = new S3({})
    const key = (user && user.username || '') + moment().format('x')
    logger.info(`Uploading transactions file to S3 with key ${key}`)
    const response = await s3.putObject({
      Bucket: aws.AWS_S3_UPDATE_TRANSACTIONS_FARGATE_BUCKET_NAME,
      Body: content,
      Key: key,
      ServerSideEncryption: 'AES256'
    })
    logger.info('Upload to S3 completed', {
      fileVersionId: response.VersionId,
      fileExpiration: response.Expiration
    })
    return key
  } catch (err: any) {
    logger.error(`Error uploading to s3: ${err.message}`)
    throw new Error('There was an error uploading the file to S3')
  }
}

const runEcsTask = async function runEcsTask(fileKey: string, jobId: string): Promise<string> {
  try {
    const ecs = new ECS({})
    const response = await ecs.runTask({
      taskDefinition: aws.AWS_ECS_UPDATE_TRANSACTIONS_FARGATE_TASK_DEFINITION,
      launchType: "FARGATE",
      networkConfiguration: {
        awsvpcConfiguration: {
          subnets: aws.AWS_VPC_UPDATE_TRANSACTIONS_FARGATE_SUBNET_IDS.split(","),
          securityGroups: aws.AWS_VPC_UPDATE_TRANSACTIONS_FARGATE_SECURITY_GROUP_IDS.split(","),
          assignPublicIp: "DISABLED"
        }
      },
      cluster: `${common.ENVIRONMENT}-fargate`,
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
    })
    logger.info('Run ECS task completed', {
      numberOfFailures: response.failures.length,
      numberOfTasksStarted: response.tasks.length
    })
    if (!response.tasks || response.tasks.length < 1) {
      throw new Error('No task data returned in ECS run task response')
    }
    return response.tasks[0].containers[0].runtimeId
  } catch (err: any) {
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

const validateAndAddDefaults = async function validateAndAddDefaults(csv: string, user: any): Promise<TransactionRow[]> {
  let validationError = false
  const data: TransactionRow[] = []

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

        if (row.requires_3ds) {
          row.requires_3ds = (row.requires_3ds === true || row.requires_3ds === 'true')
        }

        return row
      })
      .validate((row, cb) => {
        if (!row.transaction_id) {
          return cb(null, false, 'transaction_id is missing')
        }
        if (!row.transaction_type) {
          return cb(null, false, 'transaction_type is missing')
        }
        if (!row.event_name) {
          return cb(null, false, 'event_name is missing')
        }
        if (['payment', 'refund', 'dispute'].includes(row.transaction_type) && !row.updated_reason) {
          return cb(null, false, 'updated_reason is missing')
        }
        if (['payment', 'refund'].includes(row.transaction_type) && row.reason) {
          return cb(null, false, 'reason is not allowed when transaction_type is ‘payment’ or ‘refund’. did you mean to use ‘updated_reason‘?')
        }

        row.admin_github_id = formatSessionUserIdentifier(user)

        if (!moment(row.event_date, moment.ISO_8601).isValid()) {
          return cb(null, false, 'event_date is not a valid ISO_8601 string')
        }
        if (!['payment', 'refund', 'dispute'].includes(row.transaction_type)) {
          return cb(null, false, 'transaction_type must be one of ‘payment’, ‘refund’ or ‘dispute’')
        }
        if (['refund', 'dispute'].includes(row.transaction_type) && !row.parent_transaction_id) {
          return cb(null, false, 'parent_transaction_id is required when transaction_type is ‘refund’ or ‘dispute’')
        }
        if (row.captured_date && !moment(row.captured_date, moment.ISO_8601).isValid()) {
          return cb(null, false, 'captured_date is not a valid ISO_8601 string')
        }

        if (row.refund_amount_refunded && !(parseInt(row.refund_amount_refunded) >= 0)) {
          return cb(null, false, 'refund_amount_refunded must be a number')
        }

        if (row.refund_amount_available && !(parseInt(row.refund_amount_available) >= 0)) {
          return cb(null, false, 'refund_amount_available must be a number')
        }

        if (row.event_name === 'PAYMENT_STATUS_CORRECTED_TO_SUCCESS_BY_ADMIN') {
          if (!row.captured_date) {
            return cb(null, false, `captured_date is required when event_name is ‘${row.event_name}’`)
          }

          if (!row.refund_status) {
            return cb(null, false, `refund_status is required when event_name is ‘${row.event_name}’`)
          }

          if (!row.refund_amount_refunded) {
            return cb(null, false, `refund_amount_refunded is required when event_name is ‘${row.event_name}’`)
          }

          if (!row.refund_amount_available) {
            return cb(null, false, `refund_amount_available is required when event_name is ‘${row.event_name}’`)
          }
        }

        if (row.reproject_domain_object) {
          if (!['true', 'false'].includes(row.reproject_domain_object)) {
            return cb(null, false, 'reproject_domain_object must be one of ‘true’ or ‘false’')
          }
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
  } catch (err: any) {
    logger.warn('Error updating transactions', {
      message: err.message,
      filename: req.file && req.file.filename
    })
    req.flash('error', err.message)
    res.redirect('/transactions/update')
  }
}
