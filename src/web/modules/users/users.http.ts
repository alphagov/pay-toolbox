import { Request, Response, NextFunction } from 'express'
import { wrapAsyncErrorHandler } from '../../../lib/routes'
import { AdminUsers } from '../../../lib/pay-request'

import UpdateEmailFormRequest from './UpdateEmailForm'
import UpdatePhoneNumberFormRequest from './UpdatePhoneNumberForm'

import { formatErrorsForTemplate, ClientFormError } from '../common/validationErrorFormat'
import { EntityNotFoundError, IOValidationError } from '../../../lib/errors'

const show = async function show(req: Request, res: Response): Promise<void> {
  const payUser = await AdminUsers.user(req.params.id)
  const context = { payUser, messages: req.flash('info'), csrf: req.csrfToken() }

  res.render('users/users.show.njk', context)
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
  const user = await AdminUsers.user(req.params.id)
  const context: RecoverContext = { user, csrf: req.csrfToken() }
  const { recovered } = req.session

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
  const user = await AdminUsers.user(req.params.id)
  const context: RecoverContext = { user, csrf: req.csrfToken() }
  const { recovered } = req.session

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
  const { id } = req.params

  try {
    const updateRequest = new UpdateEmailFormRequest(req.body)

    await AdminUsers.updateUserEmail(id, updateRequest.email)
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
  const { id } = req.params

  try {
    const updateRequest = new UpdatePhoneNumberFormRequest(req.body)

    await AdminUsers.updateUserPhone(id, updateRequest.telephone_number)
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

const toggleUserEnabled = async function toggleUserEnabled(
  req: Request,
  res: Response
): Promise<void> {
  const { id } = req.params
  await AdminUsers.toggleUserEnabled(id)

  req.flash('info', 'Updated disabled status')
  res.redirect(`/users/${id}`)
}

const removeUserFromService = async function removeUserFromService(
  req: Request,
  res: Response
): Promise<void> {
  const { serviceId, userId } = req.params
  await AdminUsers.removeUserFromService(serviceId, userId)

  req.flash('info', `User ${userId} removed from service ${serviceId}`)
  res.redirect(`/users/${userId}`)
}

const resetUserSecondFactor = async function resetUserSecondFactor(
  req: Request,
  res: Response
): Promise<void> {
  const { id } = req.params
  await AdminUsers.resetUserSecondFactor(id)

  req.flash('info', 'User second factor method reset')
  res.redirect(`/users/${id}`)
}

const searchPage = async function searchPage(
  req: Request,
  res: Response
): Promise<void> {
  res.render('users/search', { csrf: req.csrfToken() })
}

const search = async function search(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const search = req.body.search && req.body.search.trim()
  try {
    const user = await AdminUsers.findUser(search)
    res.redirect(`/users/${user.external_id}`)
  } catch (err) {
    if (err instanceof EntityNotFoundError) {
      const user = await AdminUsers.user(search)
      return res.redirect(`/users/${user.external_id}`)
    }
    next(err)
  }
  
}

export default {
  show: wrapAsyncErrorHandler(show),
  updateEmailForm: wrapAsyncErrorHandler(updateEmailForm),
  updatePhoneNumberForm: wrapAsyncErrorHandler(updatePhoneNumberForm),
  toggleUserEnabled: wrapAsyncErrorHandler(toggleUserEnabled),
  removeUserFromService: wrapAsyncErrorHandler(removeUserFromService),
  resetUserSecondFactor: wrapAsyncErrorHandler(resetUserSecondFactor),
  search: wrapAsyncErrorHandler(search),
  searchPage: wrapAsyncErrorHandler(searchPage),
  updateEmail,
  updatePhoneNumber
}
