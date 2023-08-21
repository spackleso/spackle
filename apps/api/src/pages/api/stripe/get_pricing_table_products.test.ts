/**
 * @jest-environment node
 */
import handler from '@/pages/api/stripe/get_pricing_table_products'
import {
  createAccount,
  createFlagFeature,
  createPricingTable,
  createPricingTableProduct,
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

  test("Returns a pricing table's products", async () => {
    const account = await createAccount()
    const feature = await createFlagFeature(
      account.stripeId,
      'Feature 1',
      'feature_1',
      true,
    )
    const pricingTable = await createPricingTable(
      account.stripeId,
      'Default',
      0,
      true,
      true,
    )
    const product1 = await createStripeProduct(account.stripeId, {
      name: 'Product 1',
    })
    const p1Monthly = await createStripePrice(
      account.stripeId,
      product1.stripeId,
    )
    const p1Annual = await createStripePrice(
      account.stripeId,
      product1.stripeId,
    )
    const ptp1 = await createPricingTableProduct(
      account.stripeId,
      pricingTable.id,
      product1.stripeId,
      p1Monthly.stripeId,
      p1Annual.stripeId,
    )
    const product2 = await createStripeProduct(account.stripeId, {
      name: 'Product 2',
    })
    const p2Monthly = await createStripePrice(
      account.stripeId,
      product2.stripeId,
    )
    const p2Annual = await createStripePrice(
      account.stripeId,
      product2.stripeId,
    )
    const ptp2 = await createPricingTableProduct(
      account.stripeId,
      pricingTable.id,
      product2.stripeId,
      p2Monthly.stripeId,
      p2Annual.stripeId,
    )
    const res = await stripeTestHandler(handler, {
      method: 'POST',
      body: {
        account_id: account.stripeId,
        pricing_table_id: pricingTable.id,
      },
    })

    expect(res._getStatusCode()).toBe(200)
    const data = res._getJSONData()
    expect(data).toStrictEqual([
      {
        id: ptp1.id,
        name: 'Product 1',
        features: [
          {
            id: feature.id,
            name: 'Feature 1',
            key: 'feature_1',
            type: 0,
            value_flag: true,
            value_limit: null,
          },
        ],
        monthly_stripe_price: p1Monthly.stripeJson,
        annual_stripe_price: p1Annual.stripeJson,
      },
      {
        id: ptp2.id,
        name: 'Product 2',
        features: [
          {
            id: feature.id,
            name: 'Feature 1',
            key: 'feature_1',
            type: 0,
            value_flag: true,
            value_limit: null,
          },
        ],
        monthly_stripe_price: p2Monthly.stripeJson,
        annual_stripe_price: p2Annual.stripeJson,
      },
    ])
  })
})
