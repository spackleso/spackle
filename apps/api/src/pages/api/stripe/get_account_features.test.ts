/**
 * @jest-environment node
 */
import handler from '@/pages/api/stripe/get_account_features'
import {
  createAccount,
  createCustomerFlagFeature,
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

  test('Returns customer features', async () => {
    const decoy = await createAccount()
    await createFlagFeature(decoy.stripeId, 'Decoy', 'decoy', true)

    const account = await createAccount()
    const f1 = await createFlagFeature(
      account.stripeId,
      'Feature',
      'feature',
      true,
    )
    const f2 = await createFlagFeature(
      account.stripeId,
      'Feature 2',
      'feature_2',
      false,
    )

    const res = await stripeTestHandler(handler, {
      body: {
        account_id: account.stripeId,
      },
    })

    expect(res._getStatusCode()).toBe(200)
    expect(res._getJSONData()).toStrictEqual({
      data: [
        {
          id: f1.id,
          key: f1.key,
          value_flag: f1.valueFlag,
          value_limit: f1.valueLimit,
          name: 'Feature',
          type: f1.type,
        },
        {
          id: f2.id,
          key: f2.key,
          value_flag: f2.valueFlag,
          value_limit: f2.valueLimit,
          name: 'Feature 2',
          type: f2.type,
        },
      ],
    })
  })
})
