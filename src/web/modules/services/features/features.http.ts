import { Request, Response } from 'express'

export async function get(req: Request, res: Response): Promise<void> {
  res.render('services/features/update')
}