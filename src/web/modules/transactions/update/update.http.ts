import { Request, Response } from 'express'
import { parseString } from 'fast-csv'
import { Parser } from 'json2csv'
import { S3 } from 'aws-sdk'
import moment from 'moment'
import logger from '../../../../lib/logger'
import { aws } from '../../../../config'

type TransactionRow = {
  transaction_id: string;
  transaction_type: string;
  event_name: string;
  event_date: string;
  parent_transaction_id: string;
}

export async function fileUpload(req: Request, res: Response): Promise<void> {
  res.render('transactions/update/upload.njk', {
    csrf: req.csrfToken(),
    messages: req.flash('info'),
    errors: req.flash('error')
  })
}

const uploadToS3 = async function uploadToS3(content: string, user: any): Promise<void> {
  // The AWS SDK automatically uses the AWS credentials from the environment when deployed.
  // For local testing, set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables.
  try {
    const s3 = new S3()
    const key = (user && user.username || '') + moment().format('x')
    logger.info(`Uploading transactions file to S3 with key ${key}`)
    const response = await s3.putObject({
      Bucket: aws.AWS_S3_UPDATE_TRANSACTIONS_BUCKET_NAME,
      Body: content,
      Key: key
    }).promise();
    logger.info('S3 upload response: ' + JSON.stringify(response))
  } catch (err) {
    logger.error(`Error uploading to s3: ${err.message}`)
    throw new Error('There was an error uploading the file to S3')
  }
}

const validateAndAddDefaults = async function validateAndAddDefaults(csv: string): Promise<Object[]> {
  let validationError = false
  const data: Object[] = []

  return new Promise((resolve, reject) => {
    parseString<TransactionRow, TransactionRow>(csv, { headers: true })
      .transform((row: TransactionRow) => {
        if (!row.event_date) {
          row.event_date = moment().utc().format()
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
    const data = await validateAndAddDefaults(req.file.buffer.toLocaleString())
    const parser = new Parser()
    const output = parser.parse(data)
    await uploadToS3(output, req.user)
    req.flash('info', 'File upload successful')
  } catch (err) {
    logger.error(`Error updating transactions: ${err.message}`)
    req.flash('error', err.message)
  }
  res.redirect('/transactions/update')
}