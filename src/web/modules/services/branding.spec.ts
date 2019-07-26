import { expect } from 'chai'
import { sanitiseCustomBrandingURL } from './branding'

describe('Custom branding utilities', () => {
  it('Returns an absolute URL given a relative URL', () => {
    const url = 'some/relative/url'
    expect(sanitiseCustomBrandingURL(url)).to.equal('/some/relative/url')
  })

  it('Doesn\'t modify the URL if is already absolute', () => {
    const url = '/some/absolute/url'
    expect(sanitiseCustomBrandingURL(url)).to.equal(url)
  })
})
