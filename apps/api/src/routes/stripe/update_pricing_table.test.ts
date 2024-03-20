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
      '/stripe/update_pricing_table',
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

  test('Updates pricing table properties', async () => {
    const account = await client.createTestStripeAccount()
    const pricingTable = await client.createTestPricingTable(
      account.stripeId,
      'Default',
      0,
      true,
      true,
    )
    const res = await client.stripeRequest('/stripe/update_pricing_table', {
      method: 'POST',
      body: JSON.stringify({
        account_id: account.stripeId,
        annual_enabled: false,
        monthly_enabled: false,
        id: pricingTable.encodedId,
        pricing_table_products: [],
      }),
    })

    expect(res.status).toBe(200)

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
        .where(eq(schema.pricingTables.id, pricingTable.id))
    )[0]

    expect(pt).toStrictEqual({
      id: pricingTable.id,
      name: 'Default',
      mode: 0,
      monthlyEnabled: false,
      annualEnabled: false,
    })
  })

  // TODO: test validation
  test('Creates pricing table products based on state', async () => {
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
    const annualPrice = await client.createTestStripePrice(
      account.stripeId,
      product.stripeId,
    )
    const res = await client.stripeRequest('/stripe/update_pricing_table', {
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
            annual_stripe_price_id: annualPrice.stripeId,
          },
        ],
      }),
    })
    expect(res.status).toBe(200)

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
        .where(eq(schema.pricingTables.id, pricingTable.id))
    )[0]

    expect(pt).toStrictEqual({
      id: pricingTable.id,
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
      .where(eq(schema.pricingTableProducts.pricingTableId, pricingTable.id))

    expect(ptps.length).toBe(1)
    expect(ptps[0]).toStrictEqual({
      id: ptps[0].id,
      stripeProductId: product.stripeId,
      monthlyStripePriceId: monthlyPrice.stripeId,
      annualStripePriceId: annualPrice.stripeId,
    })
  })

  test('Deletes pricing table products based on state', async () => {
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
    const annualPrice = await client.createTestStripePrice(
      account.stripeId,
      product.stripeId,
    )
    await client.createTestPricingTableProduct(
      account.stripeId,
      pricingTable.id,
      product.stripeId,
      monthlyPrice.stripeId,
      annualPrice.stripeId,
    )

    let ptps = await client.db
      .select({
        id: schema.pricingTableProducts.id,
        stripeProductId: schema.pricingTableProducts.stripeProductId,
        monthlyStripePriceId: schema.pricingTableProducts.monthlyStripePriceId,
        annualStripePriceId: schema.pricingTableProducts.annualStripePriceId,
      })
      .from(schema.pricingTableProducts)
      .where(eq(schema.pricingTableProducts.pricingTableId, pricingTable.id))

    expect(ptps).toHaveLength(1)

    const res = await client.stripeRequest('/stripe/update_pricing_table', {
      method: 'POST',
      body: JSON.stringify({
        account_id: account.stripeId,
        annual_enabled: true,
        monthly_enabled: true,
        id: pricingTable.encodedId,
        pricing_table_products: [],
      }),
    })

    expect(res.status).toBe(200)

    ptps = await client.db
      .select({
        id: schema.pricingTableProducts.id,
        stripeProductId: schema.pricingTableProducts.stripeProductId,
        monthlyStripePriceId: schema.pricingTableProducts.monthlyStripePriceId,
        annualStripePriceId: schema.pricingTableProducts.annualStripePriceId,
      })
      .from(schema.pricingTableProducts)
      .where(eq(schema.pricingTableProducts.pricingTableId, pricingTable.id))

    expect(ptps.length).toBe(0)
  })

  test('Update pricing table products based on state', async () => {
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
    const monthlyPrice2 = await client.createTestStripePrice(
      account.stripeId,
      product.stripeId,
    )
    const annualPrice = await client.createTestStripePrice(
      account.stripeId,
      product.stripeId,
    )
    const annualPrice2 = await client.createTestStripePrice(
      account.stripeId,
      product.stripeId,
    )
    const ptp = await client.createTestPricingTableProduct(
      account.stripeId,
      pricingTable.id,
      product.stripeId,
      monthlyPrice.stripeId,
      annualPrice.stripeId,
    )

    const res = await client.stripeRequest('/stripe/update_pricing_table', {
      method: 'POST',
      body: JSON.stringify({
        account_id: account.stripeId,
        annual_enabled: true,
        monthly_enabled: true,
        id: pricingTable.encodedId,
        pricing_table_products: [
          {
            id: ptp.id,
            product_id: product.stripeId,
            monthly_stripe_price_id: monthlyPrice2.stripeId,
            annual_stripe_price_id: annualPrice2.stripeId,
          },
        ],
      }),
    })

    expect(res.status).toBe(200)

    const ptps = await client.db
      .select({
        id: schema.pricingTableProducts.id,
        stripeProductId: schema.pricingTableProducts.stripeProductId,
        monthlyStripePriceId: schema.pricingTableProducts.monthlyStripePriceId,
        annualStripePriceId: schema.pricingTableProducts.annualStripePriceId,
      })
      .from(schema.pricingTableProducts)
      .where(eq(schema.pricingTableProducts.pricingTableId, pricingTable.id))

    expect(ptps[0]).toStrictEqual({
      id: ptp.id,
      stripeProductId: product.stripeId,
      monthlyStripePriceId: monthlyPrice2.stripeId,
      annualStripePriceId: annualPrice2.stripeId,
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
    let res = await client.stripeRequest('/stripe/update_pricing_table', {
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

    res = await client.stripeRequest('/stripe/update_pricing_table', {
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
