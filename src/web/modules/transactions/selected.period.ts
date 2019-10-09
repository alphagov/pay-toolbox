// eslint-disable-next-line import/prefer-default-export
export function periodKey(requestPeriod: string): string {
  const periodKeyMap: {[key:string]: string} = {
    today: 'day',
    week: 'week',
    month: 'month'
  }
  return periodKeyMap[requestPeriod];
}
