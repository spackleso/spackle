import { render, getMockContextProps } from '@stripe/ui-extension-sdk/testing'
import { ContextView } from '@stripe/ui-extension-sdk/ui'

import Product from './Product'

describe('Product', () => {
  it('renders ContextView', () => {
    const { wrapper } = render(<Product {...getMockContextProps()} />)

    expect(wrapper.find(ContextView)).toContainText('save to reload this view')
  })
})
