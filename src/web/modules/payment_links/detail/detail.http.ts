import {NextFunction, Request, Response} from "express";
import {Products} from "../../../../lib/pay-request/client";
import {extractFriendlyLink} from "../list/list_all.http";

export async function get(req: Request, res: Response, next: NextFunction) {
    try {
        const {id} = req.params
        const paymentLink = await Products.products.retrieve(id)

        res.render('payment_links/detail', {
            paymentLink,
            url: extractFriendlyLink(paymentLink._links),
            messages: req.flash('info'),
            csrf: req.csrfToken()
        })
    } catch (error) {
        next(error)
    }
}