type SelectOptionSpec = { text: string, value: string }

export function getSelectOptions (selectedValue: string, optionSpecs: SelectOptionSpec[]) {
  type SelectOption = { value: string, text: string, selected: boolean }
  const options: SelectOption[] = [
    {
      value: null,
      text: 'All',
      selected: selectedValue === null
    }
  ]

  optionSpecs.forEach(spec => options.push({
    value: spec.value,
    text: spec.text,
    selected: selectedValue === spec.value
  }))

  return options;
}

export function getEnabledDisabledSelectOptions (value: string) {
  return getSelectOptions(value, [
    {
      text: 'Enabled',
      value: 'true'
    },
    {
      text: 'Disabled',
      value: 'false'
    }
  ])
}