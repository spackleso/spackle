/**
 * @jest-environment node
 */
import handler from '@/pages/api/stripe/sync_account'
import { stripeTestHandler, testHandler } from '@/tests/helpers'

jest.mock('@/stripe/sync', () => {
  return {
    __esModule: true,
    syncAllAccountDataAsync: jest.fn(() => Promise.resolve()),
  }
})

import { syncAllAccountDataAsync } from '@/stripe/sync'

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

  test('Syncs all account data', async () => {
    await stripeTestHandler(handler, {
      method: 'POST',
      body: {
        account_id: 'acct_123',
      },
    })
    expect((syncAllAccountDataAsync as jest.Mock).mock.calls).toHaveLength(1)
  })
})
