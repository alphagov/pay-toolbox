const nock = require('nock')
const moment = require('moment')

const { services } = require('../../config')

nock(services.ADMINUSERS_URL + '/v1/api/services')
  .get('/list')
  .reply(200, [
    {
        "id": 1,
        "external_id": "2be51bb3c98f4de8823fd7f338889ae7",
        "gateway_account_ids": [
            "1"
        ],
        "_links": [
            {
                "rel": "self",
                "method": "GET",
                "href": "http://localhost:8080/v1/api/services/2be51bb3c98f4de8823fd7f338889ae7"
            }
        ],
        "redirect_to_service_immediately_on_terminal_state": false,
        "collect_billing_address": true,
        "current_go_live_stage": "NOT_STARTED",
        "service_name": {
            "en": "Mock"
        },
        "name": "Mock"
    }
])

nock(services.ADMINUSERS_URL + '/v1/api/services')
  .get('/2be51bb3c98f4de8823fd7f338889ae7')
  .reply(200, {
    "id": 1,
    "external_id": "2be51bb3c98f4de8823fd7f338889ae7",
    "gateway_account_ids": [
        "1"
    ],
    "_links": [
        {
            "rel": "self",
            "method": "GET",
            "href": "http://localhost:8080/v1/api/services/2be51bb3c98f4de8823fd7f338889ae7"
        }
    ],
    "redirect_to_service_immediately_on_terminal_state": false,
    "collect_billing_address": true,
    "current_go_live_stage": "NOT_STARTED",
    "service_name": {
        "en": "System Generated"
    },
    "name": "System Generated"
}
)

nock(services.ADMINUSERS_URL + '/v1/api/services')
  .get('/2be51bb3c98f4de8823fd7f338889ae7/users')
  .reply(200, [
    {
        "external_id": "daffae44230745c1a4aff282c9fe5b9b",
        "username": "3eced5116b2b19b7b9b557be156cdb07@example.com",
        "email": "3eced5116b2b19b7b9b557be156cdb07@example.com",
        "otp_key": "8bq0599rgavsaivdnp5shne25q",
        "telephone_number": "+441134960000",
        "service_roles": [
            {
                "service": {
                    "id": 1,
                    "external_id": "2be51bb3c98f4de8823fd7f338889ae7",
                    "gateway_account_ids": [
                        "1"
                    ],
                    "_links": [],
                    "redirect_to_service_immediately_on_terminal_state": false,
                    "collect_billing_address": true,
                    "current_go_live_stage": "NOT_STARTED",
                    "service_name": {
                        "en": "System Generated"
                    },
                    "name": "System Generated"
                },
                "role": {
                    "name": "admin",
                    "description": "Administrator",
                    "permissions": [
                        {
                            "name": "users-service:read",
                            "description": "Viewusersinservice"
                        },
                        {
                            "name": "users-service:create",
                            "description": "Createuserinthisservice"
                        },
                        {
                            "name": "tokens-active:read",
                            "description": "Viewactivekeys"
                        },
                        {
                            "name": "tokens-revoked:read",
                            "description": "Viewrevokedkeys"
                        },
                        {
                            "name": "tokens:create",
                            "description": "Generatekey"
                        },
                        {
                            "name": "tokens:update",
                            "description": "Generatekey"
                        },
                        {
                            "name": "tokens:delete",
                            "description": "Revokekey"
                        },
                        {
                            "name": "transactions:read",
                            "description": "Viewtransactionslist"
                        },
                        {
                            "name": "transactions-by-date:read",
                            "description": "Searchtransactionsbydate"
                        },
                        {
                            "name": "transactions-by-fields:read",
                            "description": "Searchtransactionsbypaymentfields"
                        },
                        {
                            "name": "transactions-download:read",
                            "description": "Downloadtransactions"
                        },
                        {
                            "name": "transactions-details:read",
                            "description": "Viewtransactiondetails"
                        },
                        {
                            "name": "transactions-events:read",
                            "description": "Viewtransactionevents"
                        },
                        {
                            "name": "refunds:create",
                            "description": "Issuerefund"
                        },
                        {
                            "name": "transactions-amount:read",
                            "description": "Viewtransactionamounts"
                        },
                        {
                            "name": "transactions-description:read",
                            "description": "Viewtransactiondescription"
                        },
                        {
                            "name": "transactions-email:read",
                            "description": "Viewtransactionemail"
                        },
                        {
                            "name": "transactions-card-type:read",
                            "description": "Viewtransactioncardtype"
                        },
                        {
                            "name": "gateway-credentials:read",
                            "description": "Viewgatewayaccountcredentials"
                        },
                        {
                            "name": "gateway-credentials:update",
                            "description": "Editgatewayaccountcredentials"
                        },
                        {
                            "name": "service-name:read",
                            "description": "Viewservicename"
                        },
                        {
                            "name": "service-name:update",
                            "description": "Editservicename"
                        },
                        {
                            "name": "payment-types:read",
                            "description": "Viewpaymenttypes"
                        },
                        {
                            "name": "payment-types:update",
                            "description": "Editpaymenttypes"
                        },
                        {
                            "name": "email-notification-template:read",
                            "description": "Viewemailnotificationstemplate"
                        },
                        {
                            "name": "email-notification-paragraph:update",
                            "description": "Editemailnotificationsparagraph"
                        },
                        {
                            "name": "email-notification-toggle:update",
                            "description": "Turnemailnotificationson/off"
                        },
                        {
                            "name": "tokens:read",
                            "description": "View keys"
                        },
                        {
                            "name": "toggle-3ds:read",
                            "description": "View 3D Secure setting"
                        },
                        {
                            "name": "toggle-3ds:update",
                            "description": "Edit 3D Secure setting"
                        },
                        {
                            "name": "users-service:delete",
                            "description": "Remove user from a service"
                        },
                        {
                            "name": "merchant-details:read",
                            "description": "View Merchant Details setting"
                        },
                        {
                            "name": "merchant-details:update",
                            "description": "Edit Merchant Details setting"
                        },
                        {
                            "name": "toggle-billing-address:read",
                            "description": "View Billing Address setting"
                        },
                        {
                            "name": "toggle-billing-address:update",
                            "description": "Edit Billing Address setting"
                        },
                        {
                            "name": "go-live-stage:update",
                            "description": "Update Go Live stage"
                        },
                        {
                            "name": "go-live-stage:read",
                            "description": "View Go Live stage"
                        },
                        {
                            "name": "stripe-bank-details:update",
                            "description": "Update Stripe bank details"
                        },
                        {
                            "name": "stripe-bank-details:read",
                            "description": "View Stripe bank details"
                        },
                        {
                            "name": "stripe-responsible-person:update",
                            "description": "Update Stripe responsible person"
                        },
                        {
                            "name": "stripe-responsible-person:read",
                            "description": "View Stripe responsible person"
                        },
                        {
                            "name": "stripe-vat-number-company-number:update",
                            "description": "Update Stripe vat number company number"
                        },
                        {
                            "name": "stripe-vat-number-company-number:read",
                            "description": "View Stripe vat number company number"
                        },
                        {
                            "name": "connected-gocardless-account:update",
                            "description": "Update Connected Go Cardless Account"
                        },
                        {
                            "name": "connected-gocardless-account:read",
                            "description": "View Connected Go Cardless Account"
                        }
                    ]
                }
            }
        ],
        "features": null,
        "second_factor": "SMS",
        "provisional_otp_key": null,
        "provisional_otp_key_created_at": null,
        "last_logged_in_at": null,
        "disabled": false,
        "login_counter": 0,
        "session_version": 0,
        "_links": [
            {
                "rel": "self",
                "method": "GET",
                "href": "http://localhost:8080/v1/api/users/daffae44230745c1a4aff282c9fe5b9b"
            }
        ]
    },
    {
        "external_id": "0289dc1eea154ba6b90a0441bd952996",
        "username": "4e9ba82541781651e39248064393519b@example.com",
        "email": "4e9ba82541781651e39248064393519b@example.com",
        "otp_key": "u2194une9p2pr8pvue3too5ua0",
        "telephone_number": "+441134960000",
        "service_roles": [
            {
                "service": {
                    "id": 1,
                    "external_id": "2be51bb3c98f4de8823fd7f338889ae7",
                    "gateway_account_ids": [
                        "1"
                    ],
                    "_links": [],
                    "redirect_to_service_immediately_on_terminal_state": false,
                    "collect_billing_address": true,
                    "current_go_live_stage": "NOT_STARTED",
                    "service_name": {
                        "en": "System Generated"
                    },
                    "name": "System Generated"
                },
                "role": {
                    "name": "view-only",
                    "description": "View only",
                    "permissions": [
                        {
                            "name": "transactions:read",
                            "description": "Viewtransactionslist"
                        },
                        {
                            "name": "transactions-by-date:read",
                            "description": "Searchtransactionsbydate"
                        },
                        {
                            "name": "transactions-by-fields:read",
                            "description": "Searchtransactionsbypaymentfields"
                        },
                        {
                            "name": "transactions-download:read",
                            "description": "Downloadtransactions"
                        },
                        {
                            "name": "transactions-details:read",
                            "description": "Viewtransactiondetails"
                        },
                        {
                            "name": "transactions-events:read",
                            "description": "Viewtransactionevents"
                        },
                        {
                            "name": "transactions-amount:read",
                            "description": "Viewtransactionamounts"
                        },
                        {
                            "name": "transactions-description:read",
                            "description": "Viewtransactiondescription"
                        },
                        {
                            "name": "transactions-email:read",
                            "description": "Viewtransactionemail"
                        },
                        {
                            "name": "transactions-card-type:read",
                            "description": "Viewtransactioncardtype"
                        },
                        {
                            "name": "service-name:read",
                            "description": "Viewservicename"
                        },
                        {
                            "name": "payment-types:read",
                            "description": "Viewpaymenttypes"
                        },
                        {
                            "name": "email-notification-template:read",
                            "description": "Viewemailnotificationstemplate"
                        },
                        {
                            "name": "toggle-3ds:read",
                            "description": "View 3D Secure setting"
                        },
                        {
                            "name": "toggle-billing-address:read",
                            "description": "View Billing Address setting"
                        }
                    ]
                }
            }
        ],
        "features": null,
        "second_factor": "SMS",
        "provisional_otp_key": null,
        "provisional_otp_key_created_at": null,
        "last_logged_in_at": null,
        "disabled": false,
        "login_counter": 0,
        "session_version": 0,
        "_links": [
            {
                "rel": "self",
                "method": "GET",
                "href": "http://localhost:8080/v1/api/users/0289dc1eea154ba6b90a0441bd952996"
            }
        ]
    }
]
)

nock(services.CONNECTOR_URL + '/v1/api/accounts')
  .log(console.log)
  .get('/1')
  .reply(200, {
    "type": "test",
    "gateway_account_id": 1,
    "payment_provider": "sandbox",
    "service_name": "My service",
    "corporate_credit_card_surcharge_amount": 0,
    "corporate_debit_card_surcharge_amount": 0,
    "_links": {},
    "allow_apple_pay": false,
    "allow_google_pay": false,
    "corporate_prepaid_credit_card_surcharge_amount": 0,
    "corporate_prepaid_debit_card_surcharge_amount": 0,
    "email_notifications": {
        "PAYMENT_CONFIRMED": {
            "version": 1,
            "enabled": true,
            "template_body": null
        },
        "REFUND_ISSUED": {
            "version": 1,
            "enabled": true,
            "template_body": null
        }
    },
    "email_collection_mode": "MANDATORY",
    "toggle_3ds": false,
    "allow_zero_amount": false,
    "integration_version_3ds": 1
}
)

nock(services.ADMINUSERS_URL + '/v1/api')
  .log(console.log)
  .get('/services?gatewayAccountId=1')
  .reply(200, {
    "id": 1,
    "external_id": "2be51bb3c98f4de8823fd7f338889ae7",
    "gateway_account_ids": [
        "1"
    ],
    "_links": [
        {
            "rel": "self",
            "method": "GET",
            "href": "http://localhost:8080/v1/api/services/2be51bb3c98f4de8823fd7f338889ae7"
        }
    ],
    "redirect_to_service_immediately_on_terminal_state": false,
    "collect_billing_address": true,
    "current_go_live_stage": "NOT_STARTED",
    "service_name": {
        "en": "Mock"
    },
    "name": "Mock"
}
)

nock(services.ADMINUSERS_URL + '/v1/api')
  .log(console.log)
  .get('/services?gatewayAccountId=1')
  .reply(200, {
    "id": 1,
    "external_id": "2be51bb3c98f4de8823fd7f338889ae7",
    "gateway_account_ids": [
        "1"
    ],
    "_links": [
        {
            "rel": "self",
            "method": "GET",
            "href": "http://localhost:8080/v1/api/services/2be51bb3c98f4de8823fd7f338889ae7"
        }
    ],
    "redirect_to_service_immediately_on_terminal_state": false,
    "collect_billing_address": true,
    "current_go_live_stage": "NOT_STARTED",
    "service_name": {
        "en": "Mock"
    },
    "name": "Mock"
}
)

// For today
nock(services.LEDGER_URL + '/v1/report')
.log(console.log)
.get("/payments_by_state")
.query(true)
.reply(200, {
  "timedout": 1,
  "submitted": 2,
  "declined": 3,
  "created": 50,
  "success": 4,
  "cancelled": 5,
  "started": 6,
  "error": 7,
  "undefined": 8,
  "capturable": 9
})

// For today
nock(services.LEDGER_URL + '/v1/report')
  .log(console.log)
  .get('/payments')
  .query(true)
  .reply(200, {
    "count": 10,
    "gross_amount": 19000
})

nock(services.ADMINUSERS_URL + '/v1/api')
  .log(console.log)
  .get('/services?gatewayAccountId=1')
  .reply(200, {
    "id": 1,
    "external_id": "2be51bb3c98f4de8823fd7f338889ae7",
    "gateway_account_ids": [
        "1"
    ],
    "_links": [
        {
            "rel": "self",
            "method": "GET",
            "href": "http://localhost:8080/v1/api/services/2be51bb3c98f4de8823fd7f338889ae7"
        }
    ],
    "redirect_to_service_immediately_on_terminal_state": false,
    "collect_billing_address": true,
    "current_go_live_stage": "NOT_STARTED",
    "service_name": {
        "en": "Mock"
    },
    "name": "Mock"
}
)

// For week
nock(services.LEDGER_URL + '/v1/report')
.log(console.log)
.get("/payments_by_state")
.query(true)
.reply(200, {
  "timedout": 2,
  "submitted": 3,
  "declined": 4,
  "created": 60,
  "success": 6,
  "cancelled": 7,
  "started": 8,
  "error": 9,
  "undefined": 10,
  "capturable": 10
})

// For week
nock(services.LEDGER_URL + '/v1/report')
  .log(console.log)
  .get('/payments')
  .query(true)
  .reply(200, {
    "count": 48,
    "gross_amount": 20000
})

nock(services.ADMINUSERS_URL + '/v1/api')
  .log(console.log)
  .get('/services?gatewayAccountId=1')
  .reply(200, {
    "id": 1,
    "external_id": "2be51bb3c98f4de8823fd7f338889ae7",
    "gateway_account_ids": [
        "1"
    ],
    "_links": [
        {
            "rel": "self",
            "method": "GET",
            "href": "http://localhost:8080/v1/api/services/2be51bb3c98f4de8823fd7f338889ae7"
        }
    ],
    "redirect_to_service_immediately_on_terminal_state": false,
    "collect_billing_address": true,
    "current_go_live_stage": "NOT_STARTED",
    "service_name": {
        "en": "Mock"
    },
    "name": "Mock"
}
)

// For month
nock(services.LEDGER_URL + '/v1/report')
.log(console.log)
.get("/payments_by_state")
.query(true)
.reply(200, {
  "timedout": 10,
  "submitted": 30,
  "declined": 40,
  "created": 600,
  "success": 60,
  "cancelled": 70,
  "started": 80,
  "error": 90,
  "undefined": 20,
  "capturable": 50
})

// For month
nock(services.LEDGER_URL + '/v1/report')
  .log(console.log)
  .get('/payments')
  .query(true)
  .reply(200, {
    "count": 1000,
    "gross_amount": 400000
})