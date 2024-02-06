import logger from "../logger";

import axios from "axios"

function updateZendeskTicket(zendeskTicketNumber: number, zendeskTicketBody: string){
  return axios({
    method: 'put',
    url: process.env.ZENDESK_URL + `/tickets/${zendeskTicketNumber}`,
    data: {
      ticket: {
        comment: {
          body: zendeskTicketBody
        }
      },
    },
    auth: {
      username: process.env.ZENDESK_USER + '/token',
      password: process.env.ZENDESK_API_KEY
    }
  })
}


export async function updateTicketWithStripeGoLiveResponse(ticket: ZendeskTicket, stripeGoLiveUrl: string, statementDescriptor: string, payoutStatementDescriptor: string): Promise<boolean> {
  logger.info(`Updating zendesk ticket ${ticket.id} with go live response.`)

  try {
    const zendeskTicketBody = `
Hello,

Your GOV.UK Pay service with Stripe is now live. However there are still some important steps to complete before your service is ready to use.

**1. Submit additional information to Stripe**

Click this link to go to the live version of your service: ${stripeGoLiveUrl}

Submit the following information:

* the name, date of birth and home address of the person in your organisation legally responsible for payments (called your ‘responsible person’ https://www.payments.service.gov.uk/required-responsible-person-and-director-information/)
* the name, date of birth and work email address of the director of your service (or someone at director level)
* your bank details
* your VAT number and company number (if you have one)
* proof of Government Entity document

All users with admin permissions can submit this information. If you want to enable or restrict access to this, you can manage your team’s permissions in your settings.

You must add all of these details before you can take payments.
If you want to get back to these settings you can do this from the 'Settings' page for your service.


**2. Check these additional settings in your account:**

* the card types you want to enable in ‘Settings’
* if you want to collect billing or email address, or send payment and refund confirmation emails, or customise the payment confirmation email
* your team’s account permissions
* Wallet payments are enabled by default. You can disable them in ‘Settings’.


**3. Let us know if you want us to change the descriptions shown on bank statements**

The description a user will see on their bank account for these payments is ${statementDescriptor.toUpperCase()}.

The description you will see on your bank statement accompanying these payments is ${payoutStatementDescriptor.toUpperCase()}.

Please contact us if you want to change either of them.

**4. Make sure you know how to keep in touch**

Subscribe to our public status page for updates on GOV.UK Pay’s status https://payments.statuspage.io/ We'll use this page to let you know of any incidents.

Keep a note of our emergency email address. In an emergency only, you can contact the team at ${process.env.PAY_EMERGENCY_EMAIL}. It’s available 24 hours a day, and will wake someone up in the middle of the night, so please only use when necessary. An emergency is when your service can not take payments or has a significant security issue. See your GOV.UK Pay contract or MoU for more details.

If you need more help contact our support team at govuk-pay-support@digital.cabinet-office.gov.uk

You should also sign up to our service update at https://docs.google.com/forms/d/e/1FAIpQLSdJRj0asGOu3VJZ-0UPmx0T6w7FMsdduRAS51k18TS2XlNC7w/viewform We’ll use it to let you know about new features, technical updates and changes to payment regulations.

Thanks

GOV.UK Pay team
`

    await updateZendeskTicket(ticket.id, zendeskTicketBody)

    logger.info(`Zendesk ticket ${ticket} updated.`)
    return true;
  } catch (err) {
    logger.error(err)
    return false;
  }
}

export async function updateTicketWithWorldpayGoLiveResponse(ticket: ZendeskTicket, worldpayGoLiveUrl: string): Promise<boolean> {
  logger.info(`Updating zendesk ticket ${ticket.id} with go live response.`)
  try {
    const zendeskTicketBody = `
Hello,

You’re nearly ready to start taking payment on GOV.UK Pay. You just need to link your GOV.UK Pay account with your payment service provider’s (PSP) account.

You’ll find guidance about how to do this for your PSP in our documentation at https://docs.payments.service.gov.uk/switching_to_live/#switching-to-live

Click this link to go to the live version of your service: ${worldpayGoLiveUrl}

Once you’re in your account, you should confirm:

* which card types you want to enable in 'Settings' (3D Secure is enabled by default)
* Apple Pay is enabled by default. You can disable it in ‘Settings’
* if you want to collect billing or email address, or send payment and refund confirmation emails
* customise the payment confirmation email, including adding your service support contact details should your users need to query a payment
* your team’s account permissions


Then you’re ready to start taking payments.

**Keeping in touch**

If you need any help contact our support team at govuk-pay-support@digital.cabinet-office.gov.uk

Subscribe to our public status page for updates on GOV.UK Pay’s status https://payments.statuspage.io/

In an emergency, you can contact the team at ${process.env.PAY_EMERGENCY_EMAIL}. Keep a note of this email address. It’s available 24 hours a day for emergencies only, and will wake someone up in the middle of the night, so please only use when necessary. An emergency is when your service can not take payments or has a significant security issue. See your GOV.UK Pay contract or MoU for more details.

You should also sign up to our service update at https://docs.google.com/forms/d/e/1FAIpQLSdJRj0asGOu3VJZ-0UPmx0T6w7FMsdduRAS51k18TS2XlNC7w/viewform We’ll use it to let you know about new features, technical updates and changes to payment regulations.

Thanks

GOV.UK Pay team
  `

    await updateZendeskTicket(ticket.id, zendeskTicketBody)

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
    const response = await axios({
      method: 'get',
      url: process.env.ZENDESK_URL + `/tickets/${zendeskTicketNumber}`,
      auth: {
        username: process.env.ZENDESK_USER + '/token',
        password: process.env.ZENDESK_API_KEY
      }
    })

    return response.data.ticket
  } catch (err) {
    throw new Error(`Zendesk ticket number ${zendeskTicketNumber} is not valid`)
  }
}
