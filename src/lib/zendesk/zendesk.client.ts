import logger from "../logger";

const zendesk = require('node-zendesk')

const zendeskClient = zendesk.createClient({
  username: process.env.ZENDESK_USER,
  token: process.env.ZENDESK_API_KEY,
  remoteUri: process.env.ZENDESK_URL,
  proxy: process.env.http_proxy
})

export async function updateTicketWithWorldpayGoLiveResponse(ticket: ZendeskTicket, worldpayGoLiveUrl: string): Promise<boolean> {
  logger.info(`Updating zendesk ticket ${ticket.id} with go live response...`)
  try {
    await zendeskClient.tickets.update(ticket.id,
      {
        ticket: {
          // custom_fields: [{ id: 360012004639, value: "something"}], <-- This can be done in the future which would enable us to automatically close the ticket
          comment: {
            body: `
Hello,

You’re nearly ready to start taking payment on GOV.UK Pay. You just need to link your GOV.UK Pay account with your payment service provider’s (PSP) account.

You’ll find guidance about how to do this for your PSP in our documentation at https://docs.payments.service.gov.uk/switching_to_live/#switching-to-live

Click this link to go to the live version of your service: ${worldpayGoLiveUrl}

Once you’re in your account, you should confirm:

* which card types you want to enable in 'Settings' (3D Secure is enabled by default)
* if you want to collect billing or email address, or send payment and refund confirmation emails
* customise the payment confirmation email, including adding your service support contact details should your users need to query a payment
* your team’s account permissions


Then you’re ready to start taking payments.

**Keeping in touch**

If you need any help contact our support team at govuk-pay-support@digital.cabinet-office.gov.uk

Subscribe to our public status page for updates on GOV.UK Pay’s status https://payments.statuspage.io/

In an emergency, you can contact the team at ${process.env.PAY_EMERGENCY_EMAIL} Keep a note of this email address. It’s available 24 hours a day for emergencies only, and will wake someone up in the middle of the night, so please only use when necessary. An emergency is when your service can not take payments or has a significant security issue. See your GOV.UK Pay contract or MoU for more details.

You should also sign up to our service update at https://docs.google.com/forms/d/e/1FAIpQLSdJRj0asGOu3VJZ-0UPmx0T6w7FMsdduRAS51k18TS2XlNC7w/viewform We’ll use it to let you know about new features, technical updates and changes to payment regulations.

Thanks

GOV.UK Pay team
            `
          }
        }
      }
    )
    logger.info(`Zendesk ticket ${ticket} updated.`)
    return true;
  } catch (err) {
    logger.error(err)
    return false;
  }
}

export interface ZendeskTicket {
  url: string;
  id: number;
  created_at: Date;
  updated_at: Date;
  subject: string;
  description: string;
  status: string;
  requester_id: number;
  submitter_id: number;
  organization_id: number;
  assignee_id: number;
}

export async function getTicket(zendeskTicketNumber: number): Promise<ZendeskTicket> {
  try {
    return await zendeskClient.tickets.show(zendeskTicketNumber)
  } catch (err) {
    throw new Error(`Zendesk ticket number ${zendeskTicketNumber} is not valid`)
  }
}
