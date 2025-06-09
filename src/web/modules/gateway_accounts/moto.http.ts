import {GatewayAccount} from "../../../lib/pay-request/services/connector/types";
import {Service} from "../../../lib/pay-request/services/admin_users/types";
import {Product, ProductType} from "../../../lib/pay-request/services/products/types";
import {NextFunction, Request, Response} from "express";
import {AdminUsers, Connector, Products, PublicAuth} from "../../../lib/pay-request/client";
import {ClientFormError, formatErrorsForTemplate} from "../common/validationErrorFormat";
import CreateAgentInitiatedMotoProductFormRequest from "./CreateAgentInitiatedMotoProductFormRequest";
import {IOValidationError} from "../../../lib/errors";
import {TokenSource, TokenType} from "../../../lib/pay-request/services/public_auth/types";
import logger from "../../../lib/logger";

export async function motoSettings(req: Request,
                                   res: Response,
                                   next: NextFunction) {
  try {
    const {id} = req.params
    const [account, service, products] = await Promise.all([
      Connector.accounts.retrieve(id),
      AdminUsers.services.retrieveByGatewayAccountId(id),
      Products.accounts.listProductsByType(id, ProductType.Moto)
    ])
    const motoPaymentLinkExists = products.length > 0
    res.render('gateway_accounts/moto', {
      account,
      service,
      motoPaymentLinkExists,
      flash: req.flash(),
      csrf: req.csrfToken()
    })
  } catch (err) {
    next(err)
  }
}

export async function toggleMotoPayments(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const {id} = req.params
    const account = await Connector.accounts.retrieve(id)
    const enable = !account.allow_moto
    await Connector.accounts.update(id, {allow_moto: enable})

    req.flash('info', `MOTO payments ${enable ? 'enabled' : 'disabled'}`)
    res.redirect(`/gateway_accounts/${id}/moto`)
  } catch (err) {
    next(err)
  }
}

export async function toggleAllowAuthorisationApi(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const {id} = req.params
    const account = await Connector.accounts.retrieve(id)
    const enable = !account.allow_authorisation_api
    await Connector.accounts.update(id, {allow_authorisation_api: enable})

    req.flash('info', `Use of the payment authorisation API is ${enable ? 'enabled' : 'disabled'}`)
    res.redirect(`/gateway_accounts/${id}/moto`)
  } catch (err) {
    next(err)
  }
}

interface AgentInitiatedMotoPageData {
  account: GatewayAccount;
  service: Service;
  products: Product[];
  csrf: string;
  formValues?: object;
  flash: object;
  errors?: object;
  errorMap?: object[];
}

export async function toggleAllowTelephonePaymentNotifications(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const {id} = req.params
    const account = await Connector.accounts.retrieve(id)
    const enable = !account.allow_telephone_payment_notifications
    await Connector.accounts.update(id, {allow_telephone_payment_notifications: enable})

    req.flash('info', `Telephone payment notifications ${enable ? 'enabled' : 'disabled'}`)
    res.redirect(`/gateway_accounts/${id}/moto`)
  } catch (err) {
    next(err)
  }
}

export async function agentInitiatedMoto(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const {id} = req.params

    const [account, service, products] = await Promise.all([
      Connector.accounts.retrieve(id),
      AdminUsers.services.retrieveByGatewayAccountId(id),
      Products.accounts.listProductsByType(id, ProductType.Moto)
    ])

    const motoPaymentLinkExists = products.length > 0
    res.render('gateway_accounts/agent_initiated_moto', {
      account: account,
      service: service,
      products: products,
      motoPaymentLinkExists,
      flash: req.flash(),
      csrf: req.csrfToken()
    })
  } catch (err) {
    next(err)
  }
}

export async function agentInitiatedMotoProduct(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const {id} = req.params

    const [account, service, products] = await Promise.all([
      Connector.accounts.retrieve(id),
      AdminUsers.services.retrieveByGatewayAccountId(id),
      Products.accounts.listProductsByType(id, ProductType.Moto)
    ])

    const context: AgentInitiatedMotoPageData = {
      account: account,
      service: service,
      products: products,
      flash: req.flash(),
      csrf: req.csrfToken()
    }

    const {recovered} = req.session

    if (recovered) {
      context.formValues = recovered.formValues

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

    res.render('gateway_accounts/agent_initiated_moto_product', context)
  } catch (err) {
    next(err)
  }
}

export async function createAgentInitiatedMotoProduct(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    delete req.session.recovered

    const {id: gatewayAccountId} = req.params

    let formValues
    try {
      formValues = new CreateAgentInitiatedMotoProductFormRequest(req.body)
    } catch (error) {
      if (error instanceof IOValidationError) {
        req.session.recovered = {
          formValues: req.body,
          errors: formatErrorsForTemplate(error.source)
        }
        res.redirect(`/gateway_accounts/${gatewayAccountId}/agent_initiated_moto_product`)
        return
      }
    }

    const account = await Connector.accounts.retrieve(gatewayAccountId)

    const apiTokenDescription = `Agent-initiated MOTO API token: ${formValues.name}`

    const createApiTokenRequest = {
      account_id: gatewayAccountId,
      description: apiTokenDescription,
      created_by: 'govuk-pay-support@digital.cabinet-office.gov.uk',
      token_type: TokenType.Card,
      type: TokenSource.Products,
      token_account_type: account.type,
      service_mode: account.type,
      service_external_id: account.service_id
    }

    const {token} = await PublicAuth.tokens.create(createApiTokenRequest)

    logger.info(`Created agent-initiated MOTO API token for gateway account ${gatewayAccountId} with description [${apiTokenDescription}]`)

    const createAgentInitiatedMotoProductRequest = {
      gateway_account_id: gatewayAccountId,
      pay_api_token: token,
      name: formValues.name,
      description: formValues.description,
      reference_enabled: true,
      reference_label: formValues.reference_label,
      reference_hint: formValues.reference_hint,
      type: ProductType.Moto
    }

    const {external_id} = await Products.products.create(createAgentInitiatedMotoProductRequest)

    logger.info(`Created agent-initiated MOTO product with ID ${external_id} for gateway account ${gatewayAccountId}`)

    req.flash('generic', 'Agent-intiated MOTO product created')

    res.redirect(`/gateway_accounts/${gatewayAccountId}/agent_initiated_moto`)
  } catch (err) {
    next(err)
  }
}

export async function toggleAgentInitiatedMotoEnabledFlag(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const {id} = req.params

    const [account, service] = await Promise.all([
      Connector.accounts.retrieve(id),
      AdminUsers.services.retrieveByGatewayAccountId(id)
    ])
    const enable = !service.agent_initiated_moto_enabled
    await AdminUsers.services.update(service.external_id, {
      agent_initiated_moto_enabled: enable
    })
    logger.info(`Toggled agent-initiated MOTO enabled flag to ${enable} for service ${service.external_id}`, {externalId: service.external_id})

    req.flash('generic', `Agent-initiated MOTO ${enable ? 'enabled' : 'disabled'}`)
    res.redirect(`/gateway_accounts/${id}/agent_initiated_moto`)
  } catch (error) {
    next(error)
  }
}
