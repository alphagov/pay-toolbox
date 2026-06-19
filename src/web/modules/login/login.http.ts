import {NextFunction, Request, Response} from 'express'

export async function login(req: Request, res: Response, next: NextFunction) {
    try {
        res.render('login/login')
    } catch (err) {
        next(err)
    }
}
