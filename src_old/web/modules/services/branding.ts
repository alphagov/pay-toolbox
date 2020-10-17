export function sanitiseCustomBrandingURL(url: string): string {
  const urlIsAbsolute = url.startsWith('/') || url.length === 0
  return urlIsAbsolute ? url : `/${url}`
}
