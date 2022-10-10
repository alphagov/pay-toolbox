interface Operation {
  op: 'replace' | 'add';
  path: string;
  value: string | boolean | undefined | unknown;
}
export function mapRequestParamsToOperation(params: any, addOperations: string[] = []): Operation[] {
  return Object.entries(params)
    .map(([ key, value ]) => ({
      op: addOperations.includes(key) ? 'add' : 'replace',
      path: key,
      value
    }))
}
