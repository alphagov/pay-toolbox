// eslint-disable-next-line import/prefer-default-export
export function sanitiseCustomBrandingURL(url: string): string {
  const urlIsAbsolute = url.startsWith('/') || url.length === 0
  return urlIsAbsolute ? url : `/${url}`
}
