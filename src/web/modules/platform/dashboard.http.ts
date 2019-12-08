import { Request, Response } from 'express';

export function dashboard(req: Request, res: Response): void {
  res.render('platform/dashboard')
}

export function live(req: Request, res: Response): void {
  res.render('platform/live')
}