const moment = require('moment')

const govukDateFormatString = 'D MMMM YYYY'

// @TODO(sfount) date todos
// - support automomplete, right now probably an optional flag that's passed down
function isBefore(beforeDateString, includeSameAsDate = false) {
  const beforeDate = moment(beforeDateString, 'YYYY-MM-DD', true)
  if (!beforeDate.isValid()) {
    throw new Error('Invalid before date provided for validation')
  }
  return (inputDateValues, elementId) => {
    const isReal = realDate()(inputDateValues, elementId)
    if (!isReal.valid) return isReal

    const { year, month, day} = inputDateValues
    const enteredDate = moment({ year, month, day })

    const valid = includeSameAsDate ?
      enteredDate.isSameOrBefore(beforeDate) :
      enteredDate.isBefore(beforeDate)

    if (!valid) {
      const prefix = includeSameAsDate ?
        DEFAULT_REASON_TEXTS.date_must_be_before_or_same_prefix :
        DEFAULT_REASON_TEXTS.date_must_be_before_prefix

      return {
        valid: false,
        reason: `${prefix} ${beforeDate.format(govukDateFormatString)}`
      }
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
  return (inputDateValues, elementId) => {
    const isReal = realDate()(inputDateValues, elementId)
    if (!isReal.valid) return isReal

    const { year, month, day} = inputDateValues
    const enteredDate = moment({ year, month, day })

    const valid = includeSameAsDate ?
      enteredDate.isSameOrAfter(afterDate) :
      enteredDate.isAfter(afterDate)

    if (!valid) {
      const prefix = includeSameAsDate ?
        DEFAULT_REASON_TEXTS.date_must_be_after_or_same_prefix :
        DEFAULT_REASON_TEXTS.date_must_be_after_prefix

      return {
        valid: false,
        reason: `${prefix} ${afterDate.format(govukDateFormatString)}`
      }
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
  return (inputDateValues, elementId) => {
    const isReal = realDate()(inputDateValues, elementId)
    if (!isReal.valid) return isReal

    const { year, month, day} = inputDateValues
    const enteredDate = moment({ year, month, day })

    const valid = enteredDate.isBetween(beforeDate, afterDate)

    if (!valid) {
      const prefix = DEFAULT_REASON_TEXTS.date_must_be_between_prefix

      return {
        valid: false,
        reason: `${prefix} ${beforeDate.format(govukDateFormatString)} and ${afterDate.format(govukDateFormatString)}`
      }
    }
    return {
      valid: true
    }
  }
}

function isFuture(includeToday = false) {
  return (inputDateValues, elementId) => {
    const today = moment().startOf('day')
    const isReal = realDate()(inputDateValues, elementId)
    if (!isReal.valid) return isReal

    const { year, month, day} = inputDateValues
    const enteredDate = moment({ year, month, day })

    const valid = includeToday ?
      enteredDate.isSameOrAfter(today) :
      enteredDate.isAfter(today)

    if (!valid) {
      const reasonText = includeToday ?
        DEFAULT_REASON_TEXTS.date_must_be_today_or_future :
        DEFAULT_REASON_TEXTS.date_must_be_future

      return {
        valid: false,
        reason: `${reasonText}`
      }
    }
    return {
      valid: true
    }
  }
}

function isPast(includeToday = false) {
  return (inputDateValues, elementId) => {
    const today = moment().startOf('day')
    const isReal = realDate()(inputDateValues, elementId)
    if (!isReal.valid) return isReal

    const { year, month, day} = inputDateValues
    const enteredDate = moment({ year, month, day })

    const valid = includeToday ?
      enteredDate.isSameOrBefore(today) :
      enteredDate.isBefore(today)

    if (!valid) {
      const reasonText = includeToday ?
        DEFAULT_REASON_TEXTS.date_must_be_today_or_past :
        DEFAULT_REASON_TEXTS.date_must_be_past

      return {
        valid: false,
        reason: `${reasonText}`
      }
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


// @TODO(sfount) consider moving from prefixes and suffixes to a substition to potentially allow custom message
// maps to make use of the key as well (other than overriding every possible message)
const DEFAULT_REASON_TEXTS = {
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
}
function realDate() {
  return (inputDateValues, elementId) => {
    const { year, month, day } = inputDateValues

    // potential alternative (if supporting granular and all)
    // --------
    if (!inputDateValues.year && !inputDateValues.month && !inputDateValues.day) {
      return {
        href: `#${elementId}-day`,
        valid: false,
        reason: DEFAULT_REASON_TEXTS.date_is_missing
      }
    }
    const keys = [ 'day', 'month', 'year' ]
    const errorFields = []
    keys.forEach((key) => {
      if (!inputDateValues[key]) {
        errorFields.push(key)
      }
    })
    if (errorFields.length) {
      return {
        href: `#${elementId}-${errorFields[0]}`,
        valid: false,
        field: errorFields,

        // @TODO(sfount) hacky method of using keys for text values, there should be a map for these to allow
        // translation/ customisation in the future
        reason: `${DEFAULT_REASON_TEXTS.date_must_include_prefix} ${errorFields.join(' and ') }`
      }
    }

    const isValid = moment({ year, month, day }).isValid()

    if (!isValid) {
      return {
        valid: false,
        reason: DEFAULT_REASON_TEXTS.date_is_invalid
      }
    }
    return {
      valid: true,
    }
  }
}

function notEmpty() {
  return (inputStringValue) => {
    if (!inputStringValue) {
      return {
        valid: false,
        reason: DEFAULT_REASON_TEXTS.input_is_empty
      }
    }
    return {
      valid: true
    }
  }
}

function maximumCharacterLength(maximumCharacterLength) {
  if (maximumCharacterLength === undefined || maximumCharacterLength === null) {
    throw new Error('Invalid character length for maximum validation')
  }
  return (inputStringValue) => {
    const isEmpty = notEmpty()(inputStringValue)
    if (!isEmpty.valid) return isEmpty

    if (inputStringValue.length > maximumCharacterLength) {
      return {
        valid: false,
        reason: `${DEFAULT_REASON_TEXTS.input_is_too_long_prefix} ${maximumCharacterLength} ${DEFAULT_REASON_TEXTS.input_is_too_long_suffix}`
      }
    }
    return {
      valid: true
    }
  }
}

function minimumCharacterLength(minimumCharacterLength) {
  if (minimumCharacterLength === undefined || minimumCharacterLength === null) {
    throw new Error('Invalid character length for minimum validation')
  }
  return (inputStringValue) => {
    const isEmpty = notEmpty()(inputStringValue)
    if (!isEmpty.valid) return isEmpty

    if (inputStringValue.length < minimumCharacterLength) {
      return {
        valid: false,
        reason: `${DEFAULT_REASON_TEXTS.input_is_too_short_prefix} ${minimumCharacterLength} ${DEFAULT_REASON_TEXTS.input_is_too_short_suffix}`
      }
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
      const errors = element.valid
        .map((validationMethod) => {
          return validationMethod(instance[element.id].value, element.id)
        })
        .filter((validationResult) => !validationResult.valid)
      elementInstance.error = errors[0]
      if (elementInstance.error) {
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