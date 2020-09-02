const moment = require('moment')

const govukDateFormatString = 'D MMMM YYYY'

// @TODO(sfount) have `formatValidation` do the `simpleReplace` given the template and message values passed in (with the instance.token already available)

function formatValidation(valid, instance, options = { messageValues: [], template: '', reason: '' }) {
  return {
    valid,
    template: options.template,
    messageValues: options.messageValues,
    token: instance.token || DEFAULT_TOKEN,
    tokenIndex: options.template.indexOf('{token}'),
    reason: options.reason,
    ...options.field && { field: options.field },
    ...options.href && { href: options.href }
  }
}

// @TODO(sfount) date todos
// - support automomplete, right now probably an optional flag that's passed down
function isBefore(beforeDateString, includeSameAsDate = false) {
  const beforeDate = moment(beforeDateString, 'YYYY-MM-DD', true)
  if (!beforeDate.isValid()) {
    throw new Error('Invalid before date provided for validation')
  }
  return (instance) => {
    const inputDateValues = instance.value
    const token = instance.token || DEFAULT_TOKEN

    const isReal = realDate()(instance)
    if (!isReal.valid) return isReal

    const { year, month, day} = inputDateValues
    const enteredDate = moment({ year, month, day })

    const valid = includeSameAsDate ?
      enteredDate.isSameOrBefore(beforeDate) :
      enteredDate.isBefore(beforeDate)

    if (!valid) {
      const template = includeSameAsDate ?
        DEFAULT_REASON_TEXTS.date_must_be_before_or_same :
        DEFAULT_REASON_TEXTS.date_must_be_before

      return formatValidation(false, instance, {
        template,
        messageValues: [ beforeDate.format(govukDateFormatString) ],
        reason: simpleReplace(template, simpleCapitalise(token), beforeDate.format(govukDateFormatString))
      })
      // return {
      //   valid: false,
      //   reason: simpleReplace(
      //     template,
      //     simpleCapitalise(token),
      //     beforeDate.format(govukDateFormatString)
      //   )
      // }
    }
    return {
      valid: true
    }
  }
}

function isAfter(afterDateString, includeSameAsDate = false) {
  const afterDate = moment(afterDateString, 'YYYY-MM-DD', true)
  if (!afterDate.isValid()) {
    throw new Error('Invalid after date provided for validation')
  }
  return (instance, elementId) => {
    const inputDateValues = instance.value
    const token = instance.token || DEFAULT_TOKEN

    const isReal = realDate()(instance, elementId)
    if (!isReal.valid) return isReal

    const { year, month, day} = inputDateValues
    const enteredDate = moment({ year, month, day })

    const valid = includeSameAsDate ?
      enteredDate.isSameOrAfter(afterDate) :
      enteredDate.isAfter(afterDate)

    if (!valid) {
      const template = includeSameAsDate ?
        DEFAULT_REASON_TEXTS.date_must_be_after_or_same :
        DEFAULT_REASON_TEXTS.date_must_be_after

      return formatValidation(false, instance, {
        template,
        messageValues: [ afterDate.format(govukDateFormatString) ],
        reason: simpleReplace(template, simpleCapitalise(token), afterDate.format(govukDateFormatString))
      })
      // return {
      //   valid: false,
      //   reason: simpleReplace(
      //     template,
      //     simpleCapitalise(token),
      //     afterDate.format(govukDateFormatString)
      //   )
      // }
    }
    return {
      valid: true
    }
  }
}

function isBetween(beforeDateString, afterDateString) {
  const beforeDate = moment(beforeDateString, 'YYYY-MM-DD', true)
  const afterDate = moment(afterDateString, 'YYYY-MM-DD', true)
  if (!afterDate.isValid() || !beforeDate.isValid()) {
    throw new Error('Invalid date range provided for validation')
  }
  return (instance, elementId) => {
    const inputDateValues = instance.value
    const token = instance.token || DEFAULT_TOKEN

    const isReal = realDate()(instance, elementId)
    if (!isReal.valid) return isReal

    const { year, month, day} = inputDateValues
    const enteredDate = moment({ year, month, day })

    const valid = enteredDate.isBetween(beforeDate, afterDate)

    if (!valid) {
      const template = DEFAULT_REASON_TEXTS.date_must_be_between
      return formatValidation(false, instance, {
        reason: simpleReplace(
          template,
          simpleCapitalise(token),
          beforeDate.format(govukDateFormatString),
          afterDate.format(govukDateFormatString)
        ),
        messageValues: [ beforeDate.format(govukDateFormatString), afterDate.format(govukDateFormatString) ],
        template
      })
    }
    return {
      valid: true
    }
  }
}

function isFuture(includeToday = false) {
  return (instance, elementId) => {
    const inputDateValues = instance.value
    const token = instance.token || DEFAULT_TOKEN

    const today = moment().startOf('day')
    const isReal = realDate()(instance, elementId)
    if (!isReal.valid) return isReal

    const { year, month, day} = inputDateValues
    const enteredDate = moment({ year, month, day })

    const valid = includeToday ?
      enteredDate.isSameOrAfter(today) :
      enteredDate.isAfter(today)

    if (!valid) {
      const template = includeToday ?
        DEFAULT_REASON_TEXTS.date_must_be_today_or_future :
        DEFAULT_REASON_TEXTS.date_must_be_future

      return formatValidation(false, instance, {
        template,
        messageValues: [],
        reason: simpleReplace(
          template,
          simpleCapitalise(token)
        )
      })
    }
    return {
      valid: true
    }
  }
}

function isPast(includeToday = false) {
  return (instance, elementId) => {
    console.log('step into', instance)
    const inputDateValues = instance.value
    const token = instance.token || DEFAULT_TOKEN

    const today = moment().startOf('day')
    const isReal = realDate()(instance, elementId)
    if (!isReal.valid) return isReal

    const { year, month, day} = inputDateValues
    const enteredDate = moment({ year, month, day })

    const valid = includeToday ?
      enteredDate.isSameOrBefore(today) :
      enteredDate.isBefore(today)

    if (!valid) {
      const template = includeToday ?
        DEFAULT_REASON_TEXTS.date_must_be_today_or_past :
        DEFAULT_REASON_TEXTS.date_must_be_past

      return formatValidation(false, instance, {
        template,
        messageValues: [],
        reason: simpleReplace(
          template,
          simpleCapitalise(token)
        )
      })
    }
    return {
      valid: true
    }
  }
}

// @TODO(sfount) provide a consistent raw string, interpolated string, formatted ddate values for each of the validation objects

// validator functions must
// - return a validator
// accept a string
// returns validation object (?fallback on true or false)
// {
//  valid: boolean,
//  reason?: string,
//  id?: number | string,
//  field?: undefined | string -- if there's a multipart value this is the key that's specifically wrong
// }

// @TODO(sfount) there are a number of date validation cases that should all be considered
// there should probably be a way of giving a readable name to what the date is
// i.e "your passport was issued"
// this could then be templated in optionally
// The date must include a year
// The date your passport was issued must include a year
// ?optionally optionally accept a string with a %s to replace with the value

function simpleReplace(template, ...values) {
  let formatted = template
  values.forEach((replaceValue) => {
    formatted = formatted.replace('{}', replaceValue)
  })
  return formatted
}

function simpleCapitalise(string) {
  return `${string[0].toUpperCase()}${string.slice(1)}`
}

const DEFAULT_TOKEN = 'the value'

const DEFAULT_REASON_TEXTS = {
  input_must_exist: 'Enter {}', // token
  input_must_be_shorter: '{} must be {} characters or fewer', // token, character limit
  input_must_be_longer: '{} must be {} characters or more', // token, character limit

  // type: date
  date_must_be_valid: '{} must be a real date', // token
  date_must_contain_all: '{} must include a {}', // token, list of keys
  date_must_be_before: '{} must be before {}', // token, date
  date_must_be_before_or_same: '{} must be the same as or before {}', // token, date
  date_must_be_after: '{} must be after {}', // token, date
  date_must_be_after_or_same: '{} must be the same as or after {}', // token, date
  date_must_be_between: '{} must be between {} and {}', // token, from date, to date
  date_must_be_future: '{} must be in the future', // token
  date_must_be_today_or_future: '{} must be today or in the future', // token
  date_must_be_past: '{} must in the past', // token
  date_must_be_today_or_past: '{} must be today or in the past' // token
}

// @TODO(sfount) consider moving from prefixes and suffixes to a substition to potentially allow custom message
// maps to make use of the key as well (other than overriding every possible message)
/* const DEFAULT_REASON_TEXTS = {
  date_is_invalid: 'Date must be a real date',
  date_is_missing: 'Enter a date',
  date_must_include_prefix: 'Date must include a',
  date_must_be_before_prefix: 'Date must be before',
  date_must_be_before_or_same_prefix: 'Date must be the same as or before',
  date_must_be_after_prefix: 'Date must be after',
  date_must_be_after_or_same_prefix: 'Date must be the same as or after',
  date_must_be_between_prefix: 'Date must be between',
  date_must_be_between_suffix: '',
  date_must_be_future: 'Date must be in the future',
  date_must_be_today_or_future: 'Date must be today or in the future',
  date_must_be_past: 'Date must be in the past',
  date_must_be_today_or_past: 'Date must be today or in the past',

  input_is_empty: 'Enter the value',
  input_is_too_long_prefix: 'The value must be',
  input_is_too_long_suffix: 'characters or fewer',
  input_is_too_short_prefix: 'The value must be',
  input_is_too_short_suffix: 'characters or more'
} */
function realDate() {
  return (instance) => {
    const inputDateValues = instance.value
    const token = instance.token || DEFAULT_TOKEN

    const { year, month, day } = inputDateValues

    // potential alternative (if supporting granular and all)
    // --------
    if (!inputDateValues.year && !inputDateValues.month && !inputDateValues.day) {
      return formatValidation(false, instance, {
        href: `#${instance.id}-day`,
        reason: simpleReplace(
          DEFAULT_REASON_TEXTS.input_must_exist,
          token
        ),
        template: DEFAULT_REASON_TEXTS.input_must_exist,
        messageValues: [],
      })
    }
    const keys = [ 'day', 'month', 'year' ]
    const errorFields = []
    keys.forEach((key) => {
      if (!inputDateValues[key]) {
        errorFields.push(key)
      }
    })
    if (errorFields.length) {
      return formatValidation(false, instance, {
        href: `#${instance.id}-${errorFields[0]}`,
        field: errorFields,
        reason: simpleReplace(
          DEFAULT_REASON_TEXTS.date_must_contain_all,
          simpleCapitalise(token),
          errorFields.join(' and ')
        ),
        template: DEFAULT_REASON_TEXTS.date_must_contain_all,
        messageValues: errorFields
      })
    }

    const isValid = moment({ year, month, day }).isValid()

    if (!isValid) {
      const template = DEFAULT_REASON_TEXTS.date_must_be_valid
      return formatValidation(false, instance, {
        reason: simpleReplace(
          template,
          simpleCapitalise(token)
        ),
        template,
        messageValues: []
      })
    }
    return {
      valid: true,
    }
  }
}

function notEmpty() {
  return (instance) => {
    const inputStringValue = instance.value
    const token = instance.token || DEFAULT_TOKEN

    if (!inputStringValue) {
      return formatValidation(false, instance, {
        reason: simpleReplace(
          DEFAULT_REASON_TEXTS.input_must_exist,
          token
        ),
        template: DEFAULT_REASON_TEXTS.input_must_exist,
        messageValues: []
      })
    }
    return {
      valid: true
    }
  }
}

function maximumCharacterLength(maxCharacterLength) {
  if (maxCharacterLength === undefined || maxCharacterLength === null) {
    throw new Error('Invalid character length for maximum validation')
  }
  return (instance) => {
    const inputStringValue = instance.value
    const token = instance.token || DEFAULT_TOKEN

    const isEmpty = notEmpty()(instance)
    if (!isEmpty.valid) return isEmpty

    if (inputStringValue.length > maxCharacterLength) {
      return formatValidation(false, instance, {
        reason: simpleReplace(
          DEFAULT_REASON_TEXTS.input_must_be_shorter,
          simpleCapitalise(token),
          maxCharacterLength
        ),
        template: DEFAULT_REASON_TEXTS.input_must_be_shorter,
        messageValues: [ maxCharacterLength ]
      })
    }
    return {
      valid: true
    }
  }
}

function minimumCharacterLength(minCharacterLength) {
  if (minCharacterLength === undefined || minCharacterLength === null) {
    throw new Error('Invalid character length for minimum validation')
  }
  return (instance) => {
    const inputStringValue = instance.value
    const token = instance.token || DEFAULT_TOKEN

    const isEmpty = notEmpty()(instance)
    if (!isEmpty.valid) return isEmpty

    if (inputStringValue.length < minCharacterLength) {
      return formatValidation(false, instance, {
        reason: simpleReplace(
          DEFAULT_REASON_TEXTS.input_must_be_longer,
          simpleCapitalise(token),
          minCharacterLength
        ),
        template: DEFAULT_REASON_TEXTS.input_must_be_longer,
        messageValues: [ maximumCharacterLength ]
      })
    }
    return {
      valid: true
    }
  }
}

// constructor should format ready to go but `empty` and `validate` should return
// instanced copies so that there's no internal state between validations
class Form {
  constructor(...elements) {
    console.log(elements)
    // TODO(sfount) decide if we want to support _just_ strings, the interface might get confusing
    this.elements = elements.map((element) => {
      const base = typeof element === 'string' ? { id: element } : element
      base.valid = base.valid || []
      if (!Array.isArray(base.valid) && base.valid) {
        base.valid = [ base.valid ]
      }
      return base
    })
  }

  _createFormInstance() {
    const elements = this.elements.reduce((aggregate, element) => {
      aggregate[element.id] = {
        id: element.id,
        name: element.name || element.id,
        alias: element.alias || element.name || element.id,
        token: element.messages && element.messages.token || null,
        value: null,
        error: null
      }
      return aggregate
    }, {})
    return {
      ...elements,
      errors: []
    }
  }

  // interface FormDateValue {
  //   day: string;
  //   month: string;
  //   year: string;
  // }

  empty() {
    return this._createFormInstance()
  }

  // @TODO(sfount): HOW does this work if you're able to use ajax on the client and server to do validation?
  // how does it support that; that should be becoming an increasingly popular method

  // fill in the values of the form according to the recovered form values from
  // a previous submission
  // OR
  // from a model fetched from the server? (ACCORDING TO?: the aliases provided for each component)
  from(submission) {
  // from(model) {
    // return this._createFormInstance()
  }

  validate(submission) {
    const instance = this._createFormInstance()
    console.log('sub', submission)
    console.log('this elements', this.elements)
    this.elements.forEach((element) => {
      const elementInstance = instance[element.id]
      if (element.type === 'date') {
        const year = submission[`${elementInstance.name}-year`]
        const month = submission[`${elementInstance.name}-month`]
        const day = submission[`${elementInstance.name}-day`]
        elementInstance.value = { year, month, day }
        // elementInstance.value = `${year}-${month}-${day}`
      } else {
        elementInstance.value = submission[elementInstance.name] && submission[elementInstance.name].trim()
      }
      const errors = element.rules
        .map((validationMethod) => {
          console.log('validating', elementInstance)
          return validationMethod(elementInstance)
        })
        .filter((validationResult) => !validationResult.valid)
      elementInstance.error = errors[0]
      if (elementInstance.error) {
        // instance.errors.push(elementInstance.error)
        instance.errors.push({
          href: elementInstance.error.href || `#${elementInstance.id}`,
          text: elementInstance.error.reason
        })
      }
    })

    return instance
  }

  // return all of the values from the form as a JSON model
  format() {
    const instance = this._createFormInstance()
  }
}

module.exports = {
  Form,
  validate: {
    realDate,
    isAfter,
    isBefore,
    isBetween,
    isFuture,
    isPast,
    notEmpty,
    maximumCharacterLength,
    minimumCharacterLength
  }
}