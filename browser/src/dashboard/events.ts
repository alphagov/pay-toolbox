const eventsSuccess = [
  'CAPTURE_CONFIRMED',
  'CAPTURE_SUBMITTED',
  'USER_APPROVED_FOR_CAPTURE',
  'SERVICE_APPROVED_FOR_CAPTRUE'
]

// only include the first salient successful event - this will mitigate background processes capturing old payments from
// impacting optimistic numbers

// notes: ideally user approved for capture await service approval would show up on the events feed and "service approved for capture" would change the stats
// there's an existing behaviour 

// (note notes) if we've increased the aggregate amounts for the "awaiting service approval" event we _shouldn't_ then update it for the service approved for capture, if we haven't then we should but shouldn't show it(?)

// this should probably be done as a separate PR, we have similar mechanisms to avoid double counting it can just updated for this scenario
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