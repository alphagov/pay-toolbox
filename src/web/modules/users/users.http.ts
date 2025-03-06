import {Request, Response, NextFunction} from 'express'
import {wrapAsyncErrorHandler} from '../../../lib/routes'
import {AdminUsers} from '../../../lib/pay-request/client'
import logger from '../../../lib/logger'

import UpdateEmailFormRequest from './UpdateEmailForm'
import UpdatePhoneNumberFormRequest from './UpdatePhoneNumberForm'

import {formatErrorsForTemplate, ClientFormError} from '../common/validationErrorFormat'
import {EntityNotFoundError, IOValidationError} from '../../../lib/errors'
import {User} from "../../../lib/pay-request/services/admin_users/types";

const DEGATEWAY_FLAG = 'degatewayaccountification'

const show = async function show(req: Request, res: Response): Promise<void> {
  const payUser = await AdminUsers.users.retrieve(req.params.id)
  const context = {
    payUser,
    accountSimplificationEnabled: isAccountSimplificationEnabled(payUser),
    messages: req.flash('info'),
    csrf: req.csrfToken()
  }

  res.render('users/users.show.njk', context)
}

function isAccountSimplificationEnabled(user: User): boolean {
  return user.features.includes(DEGATEWAY_FLAG);
}

// @TODO(sfount) user should be defined through pay-request library, recovery values through `/lib`
interface RecoverContext {
  user: object;
  csrf: string;
  formValues?: object;
  errors?: object;
  errorMap?: object[];
}

const updatePhoneNumberForm = async function updatePhoneNumberForm(
  req: Request,
  res: Response
): Promise<void> {
  const user = await AdminUsers.users.retrieve(req.params.id)
  const context: RecoverContext = {user, csrf: req.csrfToken()}
  const {recovered} = req.session

  // @TODO(sfount) move all recovery code into one place -- all mapping to formats the template
  //               understand should be done in one place
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
  res.render('users/users.update_phone.njk', context)
}

const updateEmailForm = async function updateEmailForm(req: Request, res: Response): Promise<void> {
  const user = await AdminUsers.users.retrieve(req.params.id)
  const context: RecoverContext = {user, csrf: req.csrfToken()}
  const {recovered} = req.session

  // @TODO(sfount) move all recovery code into one place -- all mapping to formats the template
  //               understand should be done in one place
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
  res.render('users/users.update_email.njk', context)
}

const updateEmail = async function updateEmail(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const {id} = req.params

  try {
    const updateRequest = new UpdateEmailFormRequest(req.body)

    await AdminUsers.users.update(id, {email: updateRequest.email})
    req.flash('info', 'Updated email')
    res.redirect(`/users/${id}`)
  } catch (error) {
    if (error instanceof IOValidationError) {
      req.session.recovered = {
        formValues: req.body,
        errors: formatErrorsForTemplate(error.source)
      }
      res.redirect(`/users/${id}/email`)
      return
    }
    next(error)
  }
}

const updatePhoneNumber = async function updatePhoneNumber(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const {id} = req.params

  try {
    const updateRequest = new UpdatePhoneNumberFormRequest(req.body)

    await AdminUsers.users.update(id, {telephone_number: updateRequest.telephone_number})
    req.flash('info', 'Updated phone number ')
    res.redirect(`/users/${id}`)
  } catch (error) {
    if (error instanceof IOValidationError) {
      req.session.recovered = {
        formValues: req.body,
        errors: formatErrorsForTemplate(error.source)
      }
      res.redirect(`/users/${id}/phone`)
      return
    }
    next(error)
  }
}

const enableOrDisableAccountSimplification = async function enableOrDisableAccountSimplification(
    req: Request, res: Response): Promise<void> {
  const {id} = req.params
  const user = await AdminUsers.users.retrieve(id)
  if (isAccountSimplificationEnabled(user)) {
    await AdminUsers.users.updateFeatures(id, 'remove', DEGATEWAY_FLAG)
    logger.info('Account simplification feature disabled.', { user_external_id: user.external_id })
    req.flash('info', 'Account simplification disabled')
  } else {
    await AdminUsers.users.updateFeatures(id, 'add', DEGATEWAY_FLAG)
    logger.info('Account simplification feature enabled.', { user_external_id: user.external_id })
    req.flash('info', 'Account simplification enabled')
  }

  res.redirect(`/users/${id}`)
}

const toggleUserEnabled = async function toggleUserEnabled(
  req: Request,
  res: Response
): Promise<void> {
  const {id} = req.params
  const user = await AdminUsers.users.retrieve(id)
  const disable = !user.disabled
  await AdminUsers.users.update(id, {disabled: disable})

  req.flash('info', `User ${disable? 'disabled' : 'enabled'}`)
  res.redirect(`/users/${id}`)
}

const removeUserFromService = async function removeUserFromService(
  req: Request,
  res: Response
): Promise<void> {
  const {serviceId, userId} = req.params
  logger.info("Removing user from service.", {user_external_id: userId, service_external_id: serviceId})
  await AdminUsers.services.removeUser(serviceId, userId)
  logger.info("Removed user from service.", {user_external_id: userId, service_external_id: serviceId})

  req.flash('info', `User ${userId} removed from service ${serviceId}`)
  res.redirect(`/users/${userId}`)
}

const confirmRemoveUserFromService = async function confirmRemoveUserFromService(
  req: Request,
  res: Response
): Promise<void> {
  const {serviceId, userId} = req.params
  const payUser = await AdminUsers.users.retrieve(userId)
  const service = await AdminUsers.services.retrieve(serviceId)
  const context = {payUser, serviceId, userId, service, csrf: req.csrfToken()}

  res.render('users/deleteUserFromService.njk', context)
}

const resetUserSecondFactor = async function resetUserSecondFactor(
  req: Request,
  res: Response
): Promise<void> {
  const {id} = req.params
  await AdminUsers.users.resetSecondFactor(id)

  req.flash('info', 'User second factor method reset')
  res.redirect(`/users/${id}`)
}

const searchPage = async function searchPage(
  req: Request,
  res: Response
): Promise<void> {
  res.render('users/search', {csrf: req.csrfToken()})
}

const search = async function search(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const search = req.body.search && req.body.search.trim()
  try {
    const user = await AdminUsers.users.findByEmail(search)
    res.redirect(`/users/${user.external_id}`)
  } catch (err) {
    if (err instanceof EntityNotFoundError) {
      const user = await AdminUsers.users.retrieve(search)
      return res.redirect(`/users/${user.external_id}`)
    }
    next(err)
  }

}

export default {
  confirmRemoveUserFromService: wrapAsyncErrorHandler(confirmRemoveUserFromService),
  enableOrDisableAccountSimplification: wrapAsyncErrorHandler(enableOrDisableAccountSimplification),
  removeUserFromService: wrapAsyncErrorHandler(removeUserFromService),
  resetUserSecondFactor: wrapAsyncErrorHandler(resetUserSecondFactor),
  search: wrapAsyncErrorHandler(search),
  searchPage: wrapAsyncErrorHandler(searchPage),
  show: wrapAsyncErrorHandler(show),
  toggleUserEnabled: wrapAsyncErrorHandler(toggleUserEnabled),
  updateEmailForm: wrapAsyncErrorHandler(updateEmailForm),
  updatePhoneNumberForm: wrapAsyncErrorHandler(updatePhoneNumberForm),
  updateEmail,
  updatePhoneNumber
}
