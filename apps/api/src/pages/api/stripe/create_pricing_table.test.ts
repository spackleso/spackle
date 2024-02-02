/**
 * @jest-environment node
 */
import handler from '@/pages/api/stripe/create_pricing_table'
import {
  createAccount,
  createPricingTable,
  createPricingTableProduct,
  createStripePrice,
  createStripeProduct,
  stripeTestHandler,
  testHandler,
} from '@/tests/helpers'
import { desc, eq } from 'drizzle-orm'
import db, { pricingTableProducts, pricingTables } from '@/db'

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

  test('Creates pricing table', async () => {
    const account = await createAccount()
    const res = await stripeTestHandler(handler, {
      body: {
        mode: 0,
        account_id: account.stripeId,
        annual_enabled: false,
        monthly_enabled: false,
        pricing_table_products: [],
      },
    })

    expect(res._getStatusCode()).toBe(200)

    const pt = (
      await db
        .select({
          id: pricingTables.id,
          name: pricingTables.name,
          mode: pricingTables.mode,
          monthlyEnabled: pricingTables.monthlyEnabled,
          annualEnabled: pricingTables.annualEnabled,
        })
        .from(pricingTables)
        .orderBy(desc(pricingTables.id))
    )[0]

    expect(pt).toStrictEqual({
      id: pt.id,
      name: 'Default',
      mode: 0,
      monthlyEnabled: false,
      annualEnabled: false,
    })
  })

  test('Creates pricing table products based on state', async () => {
    const account = await createAccount()
    const product = await createStripeProduct(account.stripeId)
    const monthlyPrice = await createStripePrice(
      account.stripeId,
      product.stripeId,
    )
    const annualPrice = await createStripePrice(
      account.stripeId,
      product.stripeId,
    )
    const res = await stripeTestHandler(handler, {
      body: {
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
      },
    })
    expect(res._getStatusCode()).toBe(200)

    const pt = (
      await db
        .select({
          id: pricingTables.id,
          name: pricingTables.name,
          mode: pricingTables.mode,
          monthlyEnabled: pricingTables.monthlyEnabled,
          annualEnabled: pricingTables.annualEnabled,
        })
        .from(pricingTables)
        .orderBy(desc(pricingTables.id))
    )[0]

    expect(pt).toStrictEqual({
      id: pt.id,
      name: 'Default',
      mode: 0,
      monthlyEnabled: true,
      annualEnabled: true,
    })

    const ptps = await db
      .select({
        id: pricingTableProducts.id,
        stripeProductId: pricingTableProducts.stripeProductId,
        monthlyStripePriceId: pricingTableProducts.monthlyStripePriceId,
        annualStripePriceId: pricingTableProducts.annualStripePriceId,
      })
      .from(pricingTableProducts)
      .where(eq(pricingTableProducts.pricingTableId, pt.id))

    expect(ptps.length).toBe(1)
    expect(ptps[0]).toStrictEqual({
      id: ptps[0].id,
      stripeProductId: product.stripeId,
      monthlyStripePriceId: monthlyPrice.stripeId,
      annualStripePriceId: annualPrice.stripeId,
    })
  })

  test('Validates pricing table products', async () => {
    const account = await createAccount()
    const pricingTable = await createPricingTable(
      account.stripeId,
      'Default',
      0,
      false,
      false,
    )
    const product = await createStripeProduct(account.stripeId)
    const monthlyPrice = await createStripePrice(
      account.stripeId,
      product.stripeId,
    )
    let res = await stripeTestHandler(handler, {
      body: {
        account_id: account.stripeId,
        annual_enabled: true,
        monthly_enabled: true,
        id: pricingTable.encodedId,
        pricing_table_products: [
          {
            product_id: product.stripeId,
          },
        ],
      },
    })
    expect(res._getStatusCode()).toBe(400)
    expect(res._getData()).toBe(
      JSON.stringify({
        error: 'All products must have a monthly price',
      }),
    )

    res = await stripeTestHandler(handler, {
      body: {
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
      },
    })
    expect(res._getStatusCode()).toBe(400)
    expect(res._getData()).toBe(
      JSON.stringify({
        error: 'All products must have an annual price',
      }),
    )
  })
})
