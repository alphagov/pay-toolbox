// import { Request, Response, NextFunction } from 'express'
import { wrapAsyncErrorHandlers } from '../../../lib/routes'
import { AdminUsers } from '../../../lib/pay-request'

const truncate = function truncate(value: string, length: number): string {
  return `${value.substr(0, length)}...`
}

// eslint-disable-next-line arrow-body-style
const formatServiceRoles = (serviceRoles: any): any => {
  // eslint-disable-next-line arrow-body-style
  return serviceRoles.map((role: any) => {
    return {
      key: { text: role.service.name },
      value: { html: `<code>${role.service.external_id}</code` },
      actions: { items: [ { href: '#', text: 'Remove user' } ] }
    }
  })
}

// req: Request
// res: Response
const show = async function show(req: any, res: any): Promise<void> {
  const user = await AdminUsers.user(req.params.id)

  res.render('users/users.show.njk', { user, format: { serviceRoles: formatServiceRoles } })
}

// const removeFromService = async function removeFromService(req: any, res: any): Promise<void> {
// }



export default wrapAsyncErrorHandlers({ show })
