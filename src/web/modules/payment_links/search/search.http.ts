import {Request, Response} from "express";

export function get(req: Request, res: Response) {
    res.render('payment_links/search', {csrf: req.csrfToken()})
}

export function post(req: Request, res: Response) {
    const id = req.body.id.trim()
    res.redirect(`/payment_links/${id}`)
}