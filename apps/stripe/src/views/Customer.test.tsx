import { render, getMockContextProps } from '@stripe/ui-extension-sdk/testing'
import { ContextView } from '@stripe/ui-extension-sdk/ui'

import Customer from './Customer'

describe('Customer', () => {
  it('renders ContextView', () => {
    const { wrapper } = render(<Customer {...getMockContextProps()} />)
    expect(wrapper.find(ContextView)).toContainText('save to reload this view')
  })
})
