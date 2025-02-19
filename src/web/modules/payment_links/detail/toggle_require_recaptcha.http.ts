import {NextFunction, Request, Response} from "express";
import {Products} from "../../../../lib/pay-request/client";

export async function post(req: Request, res: Response, next: NextFunction) {
    try {
        const {id} = req.params
        const product = await Products.products.retrieve(id)
        const enable = !product.require_captcha
        await Products.products.update(id, product.gateway_account_id, {require_captcha: enable})

        req.flash('info', `Require CAPTCHA ${enable ? 'enabled' : 'disabled'}`)
        res.redirect(`/payment_links/${id}`)
    } catch (error) {
        next(error)
    }
}