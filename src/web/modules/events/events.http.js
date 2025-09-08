import {Connector} from '../../../lib/pay-request/client'
import {info, warn} from '../../../lib/logger'

async function emitByIdPage(req, res) {
  res.render('events/emitById', {csrf: req.csrfToken()})
}

async function emitByDatePage(req, res) {
  res.render('events/emitByDate', {csrf: req.csrfToken()})
}

async function parityCheckerPage(req, res) {
  res.render('events/parityChecker', {csrf: req.csrfToken()})
}

async function emitById(req, res) {
  const {start_id: startId, max_id: maxId, record_type: recordType, retry_delay: retryDelay} = req.body

  const validationErrors = {}
  if (!startId) {
    validationErrors.noStartId = true
  }

  if (!retryDelay) {
    validationErrors.noRetryDelay = true
  }

  if (Object.keys(validationErrors).length) {
    res.render('events/emitById', {validationErrors, csrf: req.csrfToken()})
  }

  try {
    await Connector.eventEmitter.emitByIdRange(startId, maxId, recordType, retryDelay)
    info(`Emitting events successful between ${startId} and ${maxId}`)

    res.render('events/success', {startParam: startId, endParam: maxId, action: "emit"})
  } catch (err) {
    warn(`Emitting events failed between ${startId} and ${maxId} because of: ${err.message}`)
    res.render('events/failure', {error: err.message, action: "emit"})
  }
}

async function emitByDate(req, res) {
  const {start_date: startDate, end_date: endDate, retry_delay: retryDelay} = req.body

  const validationErrors = {}
  if (!startDate) {
    validationErrors.noStartDate = true
  }

  if (!endDate) {
    validationErrors.noEndDate = true
  }

  if (!retryDelay) {
    validationErrors.noRetryDelay = true
  }

  if (Object.keys(validationErrors).length) {
    res.render('events/emitById', {validationErrors, csrf: req.csrfToken()})
  }

  try {
    await Connector.eventEmitter.emitByDate(startDate, endDate, retryDelay)
    info(`Emitting events successful between ${startDate} and ${endDate}`)

    res.render('events/success', {startParam: startDate, endParam: endDate, action: "emit"})
  } catch (err) {
    warn(`Emitting events failed between ${startDate} and ${endDate} because of: ${err.message}`)
    res.render('events/failure', {error: err.message, action: "emit"})
  }
}

async function parityCheck(req, res) {
  const {
    start_id: startId,
    max_id: maxId,
    do_not_reprocess_valid_records: doNotReprocessValidRecords,
    parity_check_status: parityCheckStatus,
    record_type: recordType,
    retry_delay: retryDelay
  } = req.body

  const validationErrors = {}
  if (!startId) {
    validationErrors.noStartId = true
  }

  if (!retryDelay) {
    validationErrors.noRetryDelay = true
  }

  if (Object.keys(validationErrors).length) {
    res.render('events/emitById', {validationErrors, csrf: req.csrfToken()})
  }

  try {
    await Connector.parityChecker.runParityCheck(startId, maxId, doNotReprocessValidRecords, parityCheckStatus, retryDelay, recordType)
    info(`Parity checking events successful between ${startId} and ${maxId}`)

    res.render('events/success', {startParam: startId, endParam: maxId, action: "parity check"})
  } catch (err) {
    warn(`Emitting events failed between ${startId} and ${maxId} because of: ${err.message}`)
    res.render('events/failure', {error: err.message, action: "parity check"})
  }
}

export default {
  emitByIdPage,
  emitById,
  emitByDate,
  emitByDatePage,
  parityCheck,
  parityCheckerPage
}
