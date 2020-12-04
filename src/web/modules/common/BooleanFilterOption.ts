export enum BooleanFilterOption {
  True = 'true',
  False = 'false',
  All = 'all'
}

export namespace BooleanFilterOption {
  export function toNullableBooleanString(booleanFilterOption: BooleanFilterOption) {
    return booleanFilterOption === BooleanFilterOption.All ? null : booleanFilterOption
  }
}