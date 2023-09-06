/**
 * @jest-environment node
 */
import handler from '@/pages/api/stripe/get_product_features'
import {
  createAccount,
  createProductFeature,
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

  test('Returns product features', async () => {
    const decoy = await createAccount()
    await createProductFeature(decoy.stripeId, true, {
      name: 'Decoy',
      key: 'decoy',
    })

    const account = await createAccount()
    const product = await createStripeProduct(account.stripeId)
    const pf1 = await createProductFeature(account.stripeId, true, {
      name: 'Feature',
      key: 'feature',
      product,
    })
    const pf2 = await createProductFeature(account.stripeId, false, {
      name: 'Feature 2',
      key: 'feature_2',
      product,
    })

    const res = await stripeTestHandler(handler, {
      body: {
        account_id: account.stripeId,
        product_id: product.stripeId,
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
