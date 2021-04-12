/* eslint-disable @typescript-eslint/no-explicit-any */
const { Connector } = require('../../../lib/pay-request')
const logger = require('../../../lib/logger')

async function emitByIdPage(req, res) {
  res.render('events/emitById', { csrf: req.csrfToken() })
}

async function emitByDatePage(req, res) {
  res.render('events/emitByDate', { csrf: req.csrfToken() })
}

async function parityCheckerPage(req, res) {
  res.render('events/parityChecker', { csrf: req.csrfToken() })
}

async function emitById(req, res) {
  const { start_id: startId, end_id: endId, record_type: recordType, retry_delay: retryDelay} = req.body

  const validationErrors = {}
  if (!startId) {
    validationErrors.noStartId = true
  }

  if (!retryDelay) {
    validationErrors.noRetryDelay = true
  }

  if (Object.keys(validationErrors).length){
    res.render('events/emitById', { validationErrors, csrf: req.csrfToken() })
  }

  try{
    await Connector.historicalEventEmitter(startId, endId, recordType, retryDelay)
    logger.info(`Emitting events successful between ${startId} and ${endId}`)

    res.render('events/success', { startParam: startId, endParam: endId, action: "emit" })
  } catch(err) {
    logger.warn(`Emitting events failed between ${startId} and ${endId} because of: ${err.message}`)
    res.render('events/failure', { error: err.message, action: "emit" })
  }
}

async function emitByDate(req, res) {
  const { start_date: startDate, end_date: endDate, record_type: recordType, retry_delay: retryDelay } = req.body
  
  const validationErrors = {}
  if (!startDate) {
    validationErrors.noStartDate = true
  }

  if(!endDate) {
    validationErrors.noEndDate = true
  }

  if (!retryDelay) {
    validationErrors.noRetryDelay = true
  }

  if (Object.keys(validationErrors).length){
    res.render('events/emitById', { validationErrors, csrf: req.csrfToken() })
  }

  try{
    await Connector.historicalEventEmitterByDate(startDate, endDate, retryDelay)
    logger.info(`Emitting events successful between ${startDate} and ${endDate}`)

    res.render('events/success', { startParam: startDate, endParam: endDate, action: "emit" })
  } catch(err) {
    logger.warn(`Emitting events failed between ${startDate} and ${endDate} because of: ${err.message}`)
    res.render('events/failure', { error: err.message, action: "emit" })
  }
}

async function parityCheck(req, res) {
  const { start_id: startId, end_id: endId, do_not_reprocess_valid_records: doNotReprocessValidRecords, parity_check_status: parityCheckStatus, record_type: recordType, retry_delay: retryDelay} = req.body

  const validationErrors = {}
  if (!startId) {
    validationErrors.noStartId = true
  }

  if (!retryDelay) {
    validationErrors.noRetryDelay = true
  }

  if (Object.keys(validationErrors).length){
    res.render('events/emitById', { validationErrors, csrf: req.csrfToken() })
  }

  try{
    await Connector.parityCheck(startId, endId, doNotReprocessValidRecords, parityCheckStatus, retryDelay, recordType)
    logger.info(`Parity checking events successful between ${startId} and ${endId}`)

    res.render('events/success', { startParam: startId, endParam: endId, action: "parity check" })
  } catch(err) {
    logger.warn(`Emitting events failed between ${startId} and ${endId} because of: ${err.message}`)
    res.render('events/failure', { error: err.message, action: "parity check" })
  }
}

module.exports = {
  emitByIdPage,
  emitById,
  emitByDate,
  emitByDatePage,
  parityCheck,
  parityCheckerPage
}
