// import { Request, Response, NextFunction } from 'express'
import { wrapAsyncErrorHandlers } from '../../../lib/routes'
import { AdminUsers } from '../../../lib/pay-request'

// req: Request
// res: Response
const show = async function show(req: any, res: any): Promise<void> {
  const user = await AdminUsers.user(req.params.id)

  res.render('users/users.show.njk', { user })
}

// const removeFromService = async function removeFromService(req: any, res: any): Promise<void> {
// }

export default wrapAsyncErrorHandlers({ show })
