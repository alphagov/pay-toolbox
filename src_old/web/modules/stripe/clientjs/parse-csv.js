// quick simple tool for mapping CSV sheets rows into this forms fields
// this should not replace human entry or checks
const INPUT_ID = 'csv_entry'
const PARSE_BUTTON_ID = 'parse_action'
const DETAILS_COMPONENT = 'parse_util'

// assumes DD/MM/YYYY - can't do anything with anything else
function parseDOB(value) {
  if (!value) return
  const elements = [ 'dob-day', 'dob-month', 'dob-year' ]
  const splitDOB = value.split('/')
  elements.forEach((id, index) => { document.getElementById(id).value = splitDOB[index] })
}

const fields = [
  { index: 2, element: 'org_name' },
  { index: 4, element: 'org_address_line_1' },
  { index: 5, element: 'org_address_city' },
  { index: 6, element: 'org_address_postcode' },
  { index: 8, element: 'bank_account_number' },
  { index: 9, element: 'bank_account_sort_code' },
  { index: 10, element: 'org_id' },
  { index: 11, element: 'org_phone_number' },
  { index: 12, element: 'org_statement_descriptor' },
  { index: 14, element: 'person_first_name' },
  { index: 15, element: 'person_last_name' },
  { index: 16, element: 'person_address_line_1' },
  { index: 17, element: 'person_address_city' },
  { index: 18, element: 'person_address_postcode' },
  { index: 19, label: 'Nominated DOB', custom: parseDOB }
]

function parseDefault(value, field) {
  document.getElementById(field.element).value = value
}

// experimental/ potentially hacks - get IP of machine through webRTC
function parseIPAddress() {
  window.RTCPeerConnection = window.RTCPeerConnection
    || window.mozRTCPeerConnection
    || window.webkitRTCPeerConnection // compatibility for firefox and chrome
  const pc = new window.RTCPeerConnection({ iceServers: [] }); const noop = () => {}
  pc.createDataChannel('') // create a bogus data channel
  pc.createOffer(pc.setLocalDescription.bind(pc), noop) // create offer and set local description
  pc.onicecandidate = (ice) => { // listen for candidate events
    if (!ice || !ice.candidate || !ice.candidate.candidate) return
    const myIP = /([0-9]{1,3}(\.[0-9]{1,3}){3}|[a-f0-9]{1,4}(:[a-f0-9]{1,4}){7})/.exec(ice.candidate.candidate)[1]
    document.getElementById('org_ip_address').value = myIP
    pc.onicecandidate = noop
  }
}
const parseInput = function parseInput() {
  const stringToParse = document.getElementById(INPUT_ID).value
  const splitString = stringToParse.split('\t')

  fields.forEach((field) => {
    const parser = field.custom || parseDefault
    parser(splitString[field.index], field)
  })

  parseIPAddress()
  document.getElementById(DETAILS_COMPONENT).open = false
  document.getElementById(INPUT_ID).value = ''
  document.body.scrollTop = 0
  document.documentElement.scrollTop = 0
}

const setupParserTool = function setupParserTool() {
  document.getElementById(PARSE_BUTTON_ID).onclick = parseInput
}

document.addEventListener('DOMContentLoaded', setupParserTool)
