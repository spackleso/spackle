import { render, getMockContextProps } from '@stripe/ui-extension-sdk/testing'
import { Box, Spinner, TextField } from '@stripe/ui-extension-sdk/ui'
import useToken from '../hooks/useToken'

import AppSettings from './AppSettings'

jest.mock('../hooks/useToken', () => ({
  __esmodule: true,
  default: jest.fn(),
}))

describe('AppSettings', () => {
  it('renders spinner when loading', () => {
    ;(useToken as jest.Mock).mockImplementation(() => {
      return {
        isLoading: true,
      }
    })

    const { wrapper } = render(<AppSettings {...getMockContextProps()} />)
    expect(wrapper.find(Box)).toContainText(
      'Use the access token below to request feature access flags via the Spackle API.',
    )
    expect(wrapper.find(Spinner)).toBeTruthy()
  })

  it('renders token when loaded', async () => {
    ;(useToken as jest.Mock).mockImplementation(() => {
      return {
        data: {
          token: 'test-token',
        },
      }
    })

    const { wrapper } = render(<AppSettings {...getMockContextProps()} />)
    expect(wrapper.find(Box)).toContainText(
      'Use the access token below to request feature access flags via the Spackle API.',
    )
    expect(wrapper.find(TextField)).toHaveProps({
      value: 'test-token',
    })
  })
})
