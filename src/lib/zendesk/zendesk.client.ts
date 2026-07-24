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

Your GOV.UK Pay service with Stripe is now live. However, you still need to complete some steps before you can start taking payments.

**1. Submit additional information to Stripe**

You can go to the live version of your service here: ${stripeGoLiveUrl}

On that page, you must submit:

* your organisation’s bank details
* the name, date of birth, home address, work telephone number, and work email address of someone who has the authority to sign a contract on behalf of your organisation (called your [‘responsible person’](https://www.payments.service.gov.uk/required-responsible-person-and-director-information))
* the name, date of birth and work email address of the director of your service (or someone at director level)
* your organisation’s VAT number (if applicable)
* your organisation‘s company registration number (if applicable)
* a document that verifies your organisation is a government entity

You must add all of these details before you can take payments.

Any user with admin permissions for your GOV.UK Pay service can submit this information. You can manage your team's permissions by selecting **Manage team members** in the GOV.UK Pay admin tool.

You can view this information in **Settings** on your service in the GOV.UK Pay admin tool.

Some smaller entities including Cadets and Parish Councils may not have an acceptable document to verify their entity. Please upload a document anyway and contact us if you think this applies to you and we can discuss a custom letter workaround process.

**2. Check additional settings**

In the GOV.UK Pay admin tool, you should also check:

* if you want to collect your users' billing addresses and email addresses in **Settings**
* the card types you want to accept in **Settings**, then **Card types**
* your team’s account permissions in **Manage team members**

If you’re taking payments for Blue Badges, you can also connect your GOV.UK Pay service to the Department for Transport’s [Manage Blue Badge application](https://admin.apply-blue-badge.service.gov.uk/sign-in). If you do not already have a Manage Blue Badge account, you‘ll need to get in touch with the Manage Blue Badge admin within your local authority. You can also read [DfT‘s guidance](https://confluence.bluebadge-support.org.uk/display/BBDS/GOV.UK+Pay) or let us know if you want to read more.

**3. Change the descriptions shown on bank statements (optional)**

The following description will appear on your users’ bank statements when they pay your service: ${statementDescriptor.toUpperCase()}.

The following description will appear on your bank statement when you receive payouts: ${payoutStatementDescriptor.toUpperCase()}.

Contact us if you want to change either of these descriptions.

**4. Make sure you know how to keep in touch**

Subscribe to [our public status page](https://payments.statuspage.io) for updates on GOV.UK Pay‘s status. We‘ll use this page to let you know of any incidents.

In an emergency, you can contact the team at ${process.env.PAY_EMERGENCY_EMAIL}. Keep a note of this email address. It’s available 24 hours a day for emergencies only. Emails to this address could wake someone up in the middle of the night, so only use it when necessary.

An emergency is when your service cannot take payments or has a significant security issue. Check your GOV.UK Pay contract or Memorandum of Understanding for more details.

Kind regards,
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

You’re nearly ready to start taking payments using GOV.UK Pay. You just need to link your GOV.UK Pay account with your Payment Service Provider’s (PSP) account.

You can [read about how to do this for your PSP in our documentation](https://docs.payments.service.gov.uk/switching_to_live/#switching-to-live).

**Configure your live service**

You can go to the live version of your service here: ${worldpayGoLiveUrl}

In the **Settings** of your live service, you should confirm:

* which card types you want to accept
* if you want to collect billing or email addresses
* if you want to send payment and refund confirmation emails
* if you want to customise the payment confirmation email

You should also configure your team’s account permission by selecting **Manage** team members from the **Overview** page in [the GOV.UK Pay admin tool](https://selfservice.payments.service.gov.uk/my-services).

If you’re taking payments for Blue Badges, you can also connect your GOV.UK Pay service to the Department for Transport’s [Manage Blue Badge application](https://admin.apply-blue-badge.service.gov.uk/sign-in). If you do not already have a Manage Blue Badge account, you’ll need to get in touch with the Manage Blue Badge admin within your local authority. You can also read [DfT’s guidance](https://confluence.bluebadge-support.org.uk/display/BBDS/GOV.UK+Pay) or let us know if you want to read more.

**Keeping in touch**

If you need any help, contact our support team at [govuk-pay-support@digital.cabinet-office.gov.uk](mailto:govuk-pay-support@digital.cabinet-office.gov.uk).

Subscribe to [our public status page](https://payments.statuspage.io/) for updates on GOV.UK Pay’s status.

In an emergency, you can contact the team at ${process.env.PAY_EMERGENCY_EMAIL}. Keep a note of this email address. It's available 24 hours a day for emergencies only. Emails to this address could wake someone up in the middle of the night, so only use it when necessary.

An emergency is when your service cannot take payments or has a significant security issue. Check your GOV.UK Pay contract or Memorandum of Understanding for more details.

Kind regards,
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
  /* eslint-disable @typescript-eslint/no-unused-vars */
  } catch (err) {
    throw new Error(`Zendesk ticket number ${zendeskTicketNumber} is not valid`)
  }
}
