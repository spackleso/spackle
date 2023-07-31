/**
 * @jest-environment node
 */
import handler from '@/pages/api/stripe/get_customer_features'
import {
  createAccount,
  createCustomerFeature,
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
    await createCustomerFeature(decoy.stripeId, 'Decoy', 'decoy', true)

    const account = await createAccount()
    const customer = await createStripeCustomer(account.stripeId)
    const cf1 = await createCustomerFeature(
      account.stripeId,
      'Feature',
      'feature',
      true,
      customer,
    )
    const cf2 = await createCustomerFeature(
      account.stripeId,
      'Feature 2',
      'feature_2',
      false,
      customer,
    )

    const res = await stripeTestHandler(handler, {
      body: {
        account_id: account.stripeId,
        customer_id: customer.stripeId,
      },
    })

    expect(res._getStatusCode()).toBe(200)
    expect(res._getJSONData()).toStrictEqual({
      data: [
        {
          id: cf1.id,
          feature_id: cf1.featureId,
          value_flag: cf1.valueFlag,
          value_limit: cf1.valueLimit,
          name: 'Feature',
        },
        {
          id: cf2.id,
          feature_id: cf2.featureId,
          value_flag: cf2.valueFlag,
          value_limit: cf2.valueLimit,
          name: 'Feature 2',
        },
      ],
    })
  })
})
