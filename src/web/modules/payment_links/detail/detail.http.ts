import {NextFunction, Request, Response} from "express";
import {Products} from "../../../../lib/pay-request/client";
import {getLinksForProductIndexedByType} from "../list/list_all.http";

export async function get(req: Request, res: Response, next: NextFunction) {
    try {
        const {id} = req.params
        const paymentLink = await Products.products.retrieve(id)
        const indexedLinks = getLinksForProductIndexedByType(paymentLink)

        res.render('payment_links/detail', {
            paymentLink,
            url: indexedLinks.friendly || indexedLinks.pay,
            messages: req.flash('info'),
            csrf: req.csrfToken()
        })
    } catch (error) {
        next(error)
    }
}