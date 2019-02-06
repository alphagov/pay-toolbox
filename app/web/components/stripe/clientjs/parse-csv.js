// quick simple tool for mapping CSV sheets rows into this forms fields
// this should not replace human entry or checks
const INPUT_ID = 'csv_entry'
const PARSE_BUTTON_ID = 'parse_action'
const DETAILS_COMPONENT = 'parse_util'

const fields = [
  { index: 2, label: 'Organisation Name', element: 'org_name' },
  { index: 4, label: 'Account Number', element: 'bank_account_number' },
  { index: 5, label: 'Sort Code', element: 'bank_account_sort_code' },
  { index: 6, label: 'VAT Number', element: 'org_id' },
  { index: 7, label: 'Phone Number', element: 'org_phone_number' },
  { index: 8, label: 'Statement Descriptor', element: 'org_statement_descriptor' },
  { index: 9, label: 'Nominated Person Name', custom: parseName },
  { index: 11, label: 'Nominated DOB', custom: parseDOB }
]

const parseInput = function parseInput () {
  const stringToParse = document.getElementById(INPUT_ID).value
  const splitString = stringToParse.split('\t')

  fields.forEach((field) => {
    const parser = field.custom || parseDefault
    parser(splitString[field.index], field)
  })

  parseIPAddress()
  document.getElementById(DETAILS_COMPONENT).open = false
  document.getElementById(INPUT_ID).value = ''
  document.body.scrollTop = document.documentElement.scrollTop = 0
}

function parseDefault (value, field) {
  document.getElementById(field.element).value = value
}

function parseName (value, field) {
  if (!value) return
  const commonTitles = ['Mr', 'Miss', 'Mrs', 'Ms', 'Mx', 'M']
  const splitName = value.split(' ')

  // consider title on supported name
  if (splitName.length === 3) {
    if (commonTitles.includes(splitName[0])) {
      splitName.shift()
    }
  }

  if (splitName.length !== 2) {
    // we don't understand this name for now - leave to support discretion
    setNameValues('', '')
    return
  }

  setNameValues(splitName[0], splitName[1])
}

function setNameValues (firstName, lastName) {
  document.getElementById('person_first_name').value = firstName
  document.getElementById('person_last_name').value = lastName
}

// assumes DD/MM/YYYY - can't do anything with anything else
function parseDOB (value, field) {
  if (!value) return
  const elements = ['dob-day', 'dob-month', 'dob-year']
  const splitDOB = value.split('/')
  elements.map((id, index) => { document.getElementById(id).value = splitDOB[index] })
}

const setup = function setup () {
  document.getElementById(PARSE_BUTTON_ID).onclick = parseInput
}

document.addEventListener('DOMContentLoaded', setup)

// experimental/ potentially hacks - get IP of machine through webRTC
function parseIPAddress() {
  window.RTCPeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection;   //compatibility for firefox and chrome
  const pc = new RTCPeerConnection({iceServers:[]}), noop = function(){};
  pc.createDataChannel("");    //create a bogus data channel
  pc.createOffer(pc.setLocalDescription.bind(pc), noop);    // create offer and set local description
  pc.onicecandidate = function(ice){  //listen for candidate events
      if(!ice || !ice.candidate || !ice.candidate.candidate)  return;
      const myIP = /([0-9]{1,3}(\.[0-9]{1,3}){3}|[a-f0-9]{1,4}(:[a-f0-9]{1,4}){7})/.exec(ice.candidate.candidate)[1];
      document.getElementById('org_ip_address').value = myIP
      pc.onicecandidate = noop;
  };
}
