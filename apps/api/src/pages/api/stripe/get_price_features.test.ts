/**
 * @jest-environment node
 */
import handler from '@/pages/api/stripe/get_price_features'
import {
  createAccount,
  createPriceFeature,
  createStripePrice,
  createStripeProduct,
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

  test('Returns price features', async () => {
    const decoy = await createAccount()
    await createPriceFeature(decoy.stripeId, 'Decoy', 'decoy', true)

    const account = await createAccount()
    const product = await createStripeProduct(account.stripeId)
    const price = await createStripePrice(account.stripeId, product.stripeId)
    const pf1 = await createPriceFeature(
      account.stripeId,
      'Feature',
      'feature',
      true,
      price,
    )
    const pf2 = await createPriceFeature(
      account.stripeId,
      'Feature 2',
      'feature_2',
      false,
      price,
    )

    const res = await stripeTestHandler(handler, {
      body: {
        account_id: account.stripeId,
        price_id: price.stripeId,
      },
    })

    expect(res._getStatusCode()).toBe(200)
    expect(res._getJSONData()).toStrictEqual({
      data: [
        {
          id: pf1.id,
          feature_id: pf1.featureId,
          value_flag: pf1.valueFlag,
          value_limit: pf1.valueLimit,
          name: 'Feature',
        },
        {
          id: pf2.id,
          feature_id: pf2.featureId,
          value_flag: pf2.valueFlag,
          value_limit: pf2.valueLimit,
          name: 'Feature 2',
        },
      ],
    })
  })
})
