import {NextFunction, Request, Response} from "express";
import {Connector, Ledger} from "../../../lib/pay-request/client";

export async function show(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const transaction = await Ledger.transactions.retrieve(req.params.id)

        res.render(`transactions/confirmFixAsyncFailedStripeRefund`, {
            transaction
        })
    } catch (error) {
        next(error)
    }
}


export async function fixAsyncFailedStripeRefund(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const transaction = await Ledger.transactions.retrieve(req.params.id)
        const gatewayAccountId = transaction.gateway_account_id
        const refundId = transaction.transaction_id
        const chargeId = transaction.parent_transaction_id
        const zendeskTicketId = req.body.zendesk_ticket_id
        const githubUserId = req.user && req.user.username

        await Connector.fixAsyncFailedStripeRefund.fixStripeRefund(gatewayAccountId, refundId, chargeId, {
            zendesk_ticket_id: zendeskTicketId,
            github_user_id: githubUserId
        })
        res.render(`transactions/confirmFixAsyncFailedStripeRefund`, {
            transaction
        })
    } catch (error) {
        next(error)
    }
}
