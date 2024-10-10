import {NextFunction, Request, Response} from "express";
import {Connector, Ledger} from "../../../lib/pay-request/client";
import {EntityNotFoundError, RESTClientError} from "../../../lib/errors";

export async function show(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const transaction = await Ledger.transactions.retrieve(req.params.id)

        res.render(`transactions/confirmFixAsyncFailedStripeRefund`, {
            transaction,
            csrf: req.csrfToken()
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
        const parentTransaction = await Ledger.transactions.retrieve(transaction.parent_transaction_id)

        await Connector.fixAsyncFailedStripeRefund.fixStripeRefund(gatewayAccountId, chargeId, refundId, {
            zendesk_ticket_id: zendeskTicketId,
            github_user_id: githubUserId
        })

        res.render(`transactions/fixAsyncFailedStripeRefundSuccess`, {
            transaction,
            parentTransaction,
            csrf: req.csrfToken()
        })

    } catch (error) {
        if (error instanceof RESTClientError)
            if (error.data.response && error.data.response.status === 404) {
                throw new EntityNotFoundError('Refund', req.params.id)
            } else if (error.data.response && (error.data.response.status === 400 || error.data.response.status === 500)) {
                res.render(`transactions/fixAsyncFailedStripeRefundErrors`, {
                    error
                })
            }

        next(error)
    }

}