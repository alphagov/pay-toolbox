// eslint-disable-next-line import/prefer-default-export
export function sanitiseCustomBrandingURL(url: string): string {
  return url.startsWith('/') ? url : `/${url}`
}
