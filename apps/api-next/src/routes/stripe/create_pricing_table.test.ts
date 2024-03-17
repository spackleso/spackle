/**
 * @jest-environment node
 */

import app from '@/index'
import { MOCK_ENV, TestClient } from '@/lib/test/client'
import { schema, eq, desc } from '@spackle/db'
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
    const res = await app.request(
      '/stripe/create_pricing_table',
      {
        method: 'POST',
        body: JSON.stringify({}),
      },
      MOCK_ENV,
    )

    expect(res.status).toBe(403)
    expect(await res.json()).toEqual({
      error: 'Unauthorized',
    })
  })

  test('Creates pricing table', async () => {
    const account = await client.createTestStripeAccount()
    const res = await client.stripeRequest('/stripe/create_pricing_table', {
      method: 'POST',
      body: JSON.stringify({
        mode: 0,
        account_id: account.stripeId,
        annual_enabled: false,
        monthly_enabled: false,
        pricing_table_products: [],
      }),
    })

    expect(res.status).toBe(201)

    const pt = (
      await client.db
        .select({
          id: schema.pricingTables.id,
          name: schema.pricingTables.name,
          mode: schema.pricingTables.mode,
          monthlyEnabled: schema.pricingTables.monthlyEnabled,
          annualEnabled: schema.pricingTables.annualEnabled,
        })
        .from(schema.pricingTables)
        .orderBy(desc(schema.pricingTables.id))
    )[0]

    expect(pt).toEqual({
      id: pt.id,
      name: 'Default',
      mode: 0,
      monthlyEnabled: false,
      annualEnabled: false,
    })
  })

  test('Creates pricing table products based on state', async () => {
    const account = await client.createTestStripeAccount()
    const product = await client.createTestStripeProduct(account.stripeId)
    const monthlyPrice = await client.createTestStripePrice(
      account.stripeId,
      product.stripeId,
    )
    const annualPrice = await client.createTestStripePrice(
      account.stripeId,
      product.stripeId,
    )
    const res = await client.stripeRequest('/stripe/create_pricing_table', {
      method: 'POST',
      body: JSON.stringify({
        account_id: account.stripeId,
        mode: 0,
        annual_enabled: true,
        monthly_enabled: true,
        pricing_table_products: [
          {
            product_id: product.stripeId,
            monthly_stripe_price_id: monthlyPrice.stripeId,
            annual_stripe_price_id: annualPrice.stripeId,
          },
        ],
      }),
    })
    expect(res.status).toBe(201)

    const pt = (
      await client.db
        .select({
          id: schema.pricingTables.id,
          name: schema.pricingTables.name,
          mode: schema.pricingTables.mode,
          monthlyEnabled: schema.pricingTables.monthlyEnabled,
          annualEnabled: schema.pricingTables.annualEnabled,
        })
        .from(schema.pricingTables)
        .orderBy(desc(schema.pricingTables.id))
    )[0]

    expect(pt).toEqual({
      id: pt.id,
      name: 'Default',
      mode: 0,
      monthlyEnabled: true,
      annualEnabled: true,
    })

    const ptps = await client.db
      .select({
        id: schema.pricingTableProducts.id,
        stripeProductId: schema.pricingTableProducts.stripeProductId,
        monthlyStripePriceId: schema.pricingTableProducts.monthlyStripePriceId,
        annualStripePriceId: schema.pricingTableProducts.annualStripePriceId,
      })
      .from(schema.pricingTableProducts)
      .where(eq(schema.pricingTableProducts.pricingTableId, pt.id))

    expect(ptps.length).toBe(1)
    expect(ptps[0]).toEqual({
      id: ptps[0].id,
      stripeProductId: product.stripeId,
      monthlyStripePriceId: monthlyPrice.stripeId,
      annualStripePriceId: annualPrice.stripeId,
    })
  })

  test('Validates pricing table products', async () => {
    const account = await client.createTestStripeAccount()
    const pricingTable = await client.createTestPricingTable(
      account.stripeId,
      'Default',
      0,
      false,
      false,
    )
    const product = await client.createTestStripeProduct(account.stripeId)
    const monthlyPrice = await client.createTestStripePrice(
      account.stripeId,
      product.stripeId,
    )
    let res = await client.stripeRequest('/stripe/create_pricing_table', {
      method: 'POST',
      body: JSON.stringify({
        account_id: account.stripeId,
        annual_enabled: true,
        monthly_enabled: true,
        id: pricingTable.encodedId,
        pricing_table_products: [
          {
            product_id: product.stripeId,
          },
        ],
      }),
    })
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({
      error: 'All products must have a monthly price',
    })

    res = await client.stripeRequest('/stripe/create_pricing_table', {
      method: 'POST',
      body: JSON.stringify({
        account_id: account.stripeId,
        annual_enabled: true,
        monthly_enabled: true,
        id: pricingTable.encodedId,
        pricing_table_products: [
          {
            product_id: product.stripeId,
            monthly_stripe_price_id: monthlyPrice.stripeId,
          },
        ],
      }),
    })
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({
      error: 'All products must have an annual price',
    })
  })
})
