import { Request, Response } from 'express'

import * as logger from '../../../lib/logger'

import {
  Connector, DirectDebitConnector, AdminUsers, PublicAuth
} from '../../../lib/pay-request'
import { wrapAsyncErrorHandler } from '../../../lib/routes'

import GatewayAccountFormModel from './gatewayAccount.model'
import { Service } from '../../../lib/pay-request/types/adminUsers'
import DirectDebitGatewayAccount from '../../../lib/pay-request/types/directDebitConnector'
import { GatewayAccount as CardGatewayAccount } from '../../../lib/pay-request/types/connector'
import { ClientFormError } from '../common/validationErrorFormat'

const overview = async function overview(req: Request, res: Response): Promise<void> {
  const { accounts } = await Connector.accounts()
  res.render('gateway_accounts/overview', { accounts, messages: req.flash('info') })
}

const overviewDirectDebit = async function overviewDirectDebit(
  req: Request,
  res: Response
): Promise<void> {
  const { accounts } = await DirectDebitConnector.accounts()
  res.render('gateway_accounts/overview', { accounts, messages: req.flash('info') })
}

const create = async function create(req: Request, res: Response): Promise<void> {
  const linkedService = req.query.service
  const context: {
    linkedCredentials: string;
    recovered?: object;
    service?: Service;
    flash: object;
    errors?: ClientFormError[];
    errorMap?: object;
  } = {
    linkedCredentials: req.query.credentials,
    flash: req.flash()
  }

  const { recovered } = req.session
  if (recovered) {
    context.recovered = recovered.formValues

    if (recovered.errors) {
      context.errors = recovered.errors
      context.errorMap = recovered.errors.reduce((aggregate: {
        [key: string]: string;
      }, error: ClientFormError) => {
        // eslint-disable-next-line no-param-reassign
        aggregate[error.id] = error.message
        return aggregate
      }, {})
    }
    delete req.session.recovered
  }

  if (linkedService) {
    const service = await AdminUsers.service(linkedService)
    context.service = service
  }
  res.render('gateway_accounts/create', context)
}

const confirm = async function confirm(req: Request, res: Response): Promise<void> {
  const account = new GatewayAccountFormModel(req.body)
  res.render('gateway_accounts/confirm', { account, request: req.body })
}

const writeAccount = async function writeAccount(req: Request, res: Response): Promise<void> {
  const account = new GatewayAccountFormModel(req.body)
  const linkedService = req.body.systemLinkedService

  let gatewayAccountIdDerived: string
  let createdAccount: object
  if (account.isDirectDebit) {
    const directDebitAccount: DirectDebitGatewayAccount = await DirectDebitConnector.createAccount(account.formatPayload())
    createdAccount = directDebitAccount
    gatewayAccountIdDerived = directDebitAccount.gateway_account_external_id
  } else {
    const cardAccount: CardGatewayAccount = await Connector.createAccount(account.formatPayload())
    createdAccount = cardAccount
    gatewayAccountIdDerived = String(cardAccount.gateway_account_id)
  }

  logger.info(`Created new Gateway Account ${gatewayAccountIdDerived}`)

  // connect system linked services to the created account
  if (linkedService) {
    await AdminUsers.updateServiceGatewayAccount(
      linkedService,
      gatewayAccountIdDerived
    )
    logger.info(`Service ${linkedService} linked to new Gateway Account ${gatewayAccountIdDerived}`)

    await AdminUsers.updateServiceGoLiveStatus(linkedService, 'LIVE')
    logger.info(`Service ${linkedService} 'current_go_live_stage' updated to 'LIVE'`)
  }

  // note payment_provider is not returned in the object returned from createAccount
  res.render('gateway_accounts/createSuccess', {
    account: createdAccount, linkedService, gatewayAccountIdDerived, provider: account.provider
  })
}

const detail = async function detail(req: Request, res: Response): Promise<void> {
  const { id } = req.params
  let services = {}
  const isDirectDebitID = id.match(/^DIRECT_DEBIT:/)
  const readAccountMethod = isDirectDebitID ? DirectDebitConnector.account : Connector.account

  const account = await readAccountMethod(id)

  try {
    services = await AdminUsers.gatewayAccountServices(id)
  } catch (error) {
    logger.warn(`Services request for gateway account ${id} returned "${error.message}"`)
  }

  res.render('gateway_accounts/detail', { account, gatewayAccountId: id, services })
}

const apiKeys = async function apiKeys(req: Request, res: Response): Promise<void> {
  const gatewayAccountId = req.params.id
  const tokens = await PublicAuth.apiKeyTokens(gatewayAccountId)
  res.render('gateway_accounts/api_keys', { tokens, gatewayAccountId, messages: req.flash('info') })
}

const deleteApiKey = async function deleteApiKey(req: Request, res: Response): Promise<void> {
  const { accountId, tokenId } = req.params

  await PublicAuth.deleteApiToken(accountId, tokenId)
  logger.info(`Deleted API Token with ID ${tokenId} for Gateway Account ${accountId}`)

  req.flash('info', `Token ${tokenId} successfully deleted`)
  res.redirect(`/gateway_accounts/${accountId}/api_keys`)
}

export default {
  overview: wrapAsyncErrorHandler(overview),
  overviewDirectDebit: wrapAsyncErrorHandler(overviewDirectDebit),
  create: wrapAsyncErrorHandler(create),
  confirm: wrapAsyncErrorHandler(confirm),
  writeAccount: wrapAsyncErrorHandler(writeAccount),
  detail: wrapAsyncErrorHandler(detail),
  apiKeys: wrapAsyncErrorHandler(apiKeys),
  deleteApiKey: wrapAsyncErrorHandler(deleteApiKey)
}
