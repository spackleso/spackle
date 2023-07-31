/**
 * @jest-environment node
 */
import handler from '@/pages/api/stripe/identify'
import {
  createAccount,
  createUser,
  stripeTestHandler,
  testHandler,
} from '@/tests/helpers'

jest.mock('@/posthog', () => {
  return {
    __esModule: true,
    identify: jest.fn(),
  }
})

import { identify } from '@/posthog'
import exp from 'constants'

describe('POST', () => {
  test('Requires a signature', async () => {
    const res = await testHandler(handler, {
      method: 'POST',
      body: {},
    })

    expect(res._getStatusCode()).toBe(403)
    expect(res._getData()).toBe(
      JSON.stringify({
        error: 'Unauthorized',
      }),
    )
  })

  test('Sends an identify event to PostHog', async () => {
    const account = await createAccount()
    const user = await createUser(account.stripeId)
    const res = await stripeTestHandler(handler, {
      method: 'POST',
      body: {
        account_id: account.stripeId,
        user_id: user.stripeId,
        user_email: user.email,
        user_name: user.name,
      },
    })

    expect(res._getStatusCode()).toBe(200)
    expect((identify as jest.Mock).mock.calls).toHaveLength(1)
  })
})
