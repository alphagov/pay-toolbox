const eventsSuccess = [
  'CAPTURE_CONFIRMED',
  'CAPTURE_SUBMITTED',
  'USER_APPROVED_FOR_CAPTURE',
  'SERVICE_APPROVED_FOR_CAPTRUE'
]

// only include the first salient successful event - this will mitigate background processes capturing old payments from
// impacting optimistic numbers
export const eventsActiveSuccess = [
  'USER_APPROVED_FOR_CAPTURE_AWAITING_SERVICE_APPROVAL',
  'USER_APPROVED_FOR_CAPTURE',
  'SERVICE_APPROVED_FOR_CAPTURE'
]

export const eventsErrored = [
  'GATEWAY_ERROR_DURING_AUTHORISATION',
  'GATEWAY_TIMEOUT_DURING_AUTHORISATION',
  'UNEXPECTED_GATEWAY_ERROR_DURING_AUTHORISATION',
  'CAPTURE_ERRORED',
  'CAPTURE_ABANDONED_AFTER_TOO_MANY_RETRIES'
]

export const supportedEvents = [
  'PAYMENT_CREATED',
  'PAYMENT_DETAILS_ENTERED',
  ...eventsActiveSuccess,
  ...eventsErrored
]