/**
 * @jest-environment node
 */
import handler from '@/pages/api/stripe/get_account'
import { createAccount, stripeTestHandler, testHandler } from '@/tests/helpers'

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

  test('Returns an account', async () => {
    const account = await createAccount()
    const res = await stripeTestHandler(handler, {
      method: 'POST',
      body: {
        account_id: account.stripeId,
        account_name: 'Account Name',
      },
    })

    expect(res._getStatusCode()).toBe(200)
    expect(res._getJSONData()).toStrictEqual({
      has_acknowledged_setup: false,
      id: account.id,
      initial_sync_complete: false,
      initial_sync_started_at: null,
      stripe_id: account.stripeId,
    })
  })
})
