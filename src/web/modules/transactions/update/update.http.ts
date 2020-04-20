import { Request, Response } from 'express'
import { parseString } from 'fast-csv'
import { S3 } from 'aws-sdk'
import moment from 'moment'
import logger from '../../../../lib/logger'
import { aws } from '../../../../config'

type TransactionRow = {
  transaction_id: string;
  event_date: string;
}

export async function fileUpload(req: Request, res: Response): Promise<void> {
  res.render('transactions/update/upload.njk', {
    csrf: req.csrfToken(),
    messages: req.flash('info'),
    errors: req.flash('error')
  })
}

const uploadToS3 = async function uploadToS3(fileBuffer: Buffer, user: any): Promise<void> {
  // The AWS SDK automatically uses the AWS credentials from the environment when deployed.
  // For local testing, set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables.
  const s3 = new S3()
  const key = (user && user.username || '') + moment().format('x')
  logger.info(`Uploading transactions file to S3 with key ${key}`)
  const response = await s3.putObject({
    Bucket: aws.AWS_S3_UPDATE_TRANSACTIONS_BUCKET_NAME,
    Body: fileBuffer,
    Key: key
  }).promise();
  logger.info('S3 upload response: ' + JSON.stringify(response))
}

export async function update(req: Request, res: Response): Promise<void> {
  let validationError = false
  parseString<TransactionRow, TransactionRow>(req.file.buffer.toLocaleString(), { headers: true })
    .validate((row, cb) => {
      if (!row.transaction_id) {
        return cb(null, false, 'transaction_id is missing')
      }
      if (row.event_date && !moment(row.event_date, moment.ISO_8601).isValid()) {
        return cb(null, false, 'event_date is not a valid ISO_8601 string')
      }
      return cb(null, true)
    })
    .on('error', error => {
      req.flash('error', `There was an error parsing the csv: ${error.message}`)
    })
    .on('data', row => { })
    .on('data-invalid', (row, rowNumber, reason) => {
      validationError = true
      req.flash('error', `CSV invalid on row ${rowNumber}: ${reason}`)
      res.redirect('/transactions/update')
    })
    .on('end', async (rowCount: number) => {
      // end is fired if final row is parsed even if there is a validation error
      if (!validationError) {
        logger.info(`Successfully parsed transactions update CSV: ${rowCount} rows`)
        try {
          await uploadToS3(req.file.buffer, req.user)
          req.flash('info', 'File upload successful')
        } catch (err) {
          logger.error('Error uploading to s3: ' + err.message)
          req.flash('error', 'There was an error uploading the file to S3')
        }
        res.redirect('/transactions/update')
      }
    })
}