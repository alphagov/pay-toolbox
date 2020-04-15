import { Request, Response } from 'express'
import { parseString } from 'fast-csv'
import moment from 'moment'
import logger from '../../../../lib/logger'

export async function fileUpload(req: Request, res: Response): Promise<void> {
  res.render('transactions/update/upload.njk', {
    csrf: req.csrfToken(),
    messages: req.flash('info'),
    errors: req.flash('error')
  })
}

type TransactionRow = {
  transaction_id: string;
  event_date: string;
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
    .on('data', row => {})
    .on('data-invalid', (row, rowNumber, reason) => {
      validationError = true
      req.flash('error', `CSV invalid on row ${rowNumber}: ${reason}`)
      res.redirect('/transactions/update')
    })
    .on('end', (rowCount: number) => {
      // end is fired if final row is parsed even if there is a validation error
      if (!validationError) {
        logger.info(`Successfully parsed transactions update CSV: ${rowCount} rows`)
        req.flash('info', 'File upload successful. Note: this doesn\'t do anything yet')
        res.redirect('/transactions/update')
      }
    })
}