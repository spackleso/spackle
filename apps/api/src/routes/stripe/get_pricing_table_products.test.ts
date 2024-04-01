/**
 * @jest-environment node
 */

import app from '@/index'
import { TestClient } from '@/lib/test/client'
import { beforeAll, afterAll, describe, test, expect } from 'vitest'

let client: TestClient
beforeAll(async () => {
  client = new TestClient(app)
})
afterAll(async () => {
  await client.teardown()
})

describe('POST', () => {
  test('Requires a signature', async () => {
    const res = await client.request('/stripe/get_pricing_table_products', {
      method: 'POST',
      body: JSON.stringify({}),
    })

    expect(res.status).toBe(403)
    expect(await res.json()).toEqual({
      error: 'Unauthorized',
    })
  })

  test("Returns a pricing table's products", async () => {
    const account = await client.createTestStripeAccount()
    await client.createTestFlagFeature(
      account.stripeId,
      'Feature 1',
      'feature_1',
      true,
    )
    const pricingTable = await client.createTestPricingTable(
      account.stripeId,
      'Default',
      0,
      true,
      true,
    )
    const product1 = await client.createTestStripeProduct(account.stripeId, {
      name: 'Product 1',
    })
    const p1Monthly = await client.createTestStripePrice(
      account.stripeId,
      product1.stripeId,
    )
    const p1Annual = await client.createTestStripePrice(
      account.stripeId,
      product1.stripeId,
    )
    const ptp1 = await client.createTestPricingTableProduct(
      account.stripeId,
      pricingTable.id,
      product1.stripeId,
      p1Monthly.stripeId,
      p1Annual.stripeId,
    )
    const product2 = await client.createTestStripeProduct(account.stripeId, {
      name: 'Product 2',
    })
    const p2Monthly = await client.createTestStripePrice(
      account.stripeId,
      product2.stripeId,
    )
    const p2Annual = await client.createTestStripePrice(
      account.stripeId,
      product2.stripeId,
    )
    const ptp2 = await client.createTestPricingTableProduct(
      account.stripeId,
      pricingTable.id,
      product2.stripeId,
      p2Monthly.stripeId,
      p2Annual.stripeId,
    )
    const res = await client.stripeRequest(
      '/stripe/get_pricing_table_products',
      {
        method: 'POST',
        body: JSON.stringify({
          account_id: account.stripeId,
          pricing_table_id: pricingTable.encodedId,
        }),
      },
    )

    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data).toEqual([
      {
        id: ptp1.id,
        name: 'Product 1',
        product_id: product1.stripeId,
        monthly_stripe_price: p1Monthly.stripeJson,
        annual_stripe_price: p1Annual.stripeJson,
      },
      {
        id: ptp2.id,
        name: 'Product 2',
        product_id: product2.stripeId,
        monthly_stripe_price: p2Monthly.stripeJson,
        annual_stripe_price: p2Annual.stripeJson,
      },
    ])
  })
})
