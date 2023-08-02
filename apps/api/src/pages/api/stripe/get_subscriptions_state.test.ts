/**
 * @jest-environment node
 */
import handler from '@/pages/api/stripe/get_subscriptions_state'
import {
  createAccount,
  createFlagFeature,
  createStripeCustomer,
  stripeTestHandler,
  testHandler,
} from '@/tests/helpers'

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

  test('Returns the subscription features state', async () => {
    const account = await createAccount()
    const customer = await createStripeCustomer(account.stripeId)
    const feature = await createFlagFeature(
      account.stripeId,
      'Test',
      'test',
      false,
    )

    const res = await stripeTestHandler(handler, {
      method: 'POST',
      body: {
        account_id: account.stripeId,
        customer_id: customer.stripeId,
        mode: 'test',
      },
    })

    expect(res._getStatusCode()).toBe(200)
    expect(res._getJSONData()).toStrictEqual({
      data: [
        {
          id: feature.id,
          name: 'Test',
          key: 'test',
          type: 0,
          value_flag: false,
          value_limit: null,
        },
      ],
    })
  })
})
