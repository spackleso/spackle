/**
 * @jest-environment node
 */
import handler from '@/pages/api/stripe/get_pricing_tables'
import {
  createAccount,
  createFlagFeature,
  createProductFeature,
  createStripePrice,
  createStripeProduct,
  stripeTestHandler,
  testHandler,
} from '@/tests/helpers'
import db, { pricingTableProducts, pricingTables } from 'spackle-db'

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

  test('Creates a default pricing table', async () => {
    const account = await createAccount()
    const res = await stripeTestHandler(handler, {
      method: 'POST',
      body: {
        account_id: account.stripeId,
        mode: 'live',
      },
    })

    expect(res._getStatusCode()).toBe(200)
    const data = res._getJSONData()
    expect(data.length).toBe(1)
    const { id, ...pricingTable } = data[0]
    expect(id).toBeDefined()
    expect(pricingTable).toStrictEqual({
      name: 'Default',
      monthlyEnabled: false,
      annualEnabled: false,
    })
  })

  test('Returns a pricing table', async () => {
    const account = await createAccount()
    const pricingTable = (
      await db
        .insert(pricingTables)
        .values({
          name: 'Default',
          stripeAccountId: account.stripeId,
          mode: 0,
          monthlyEnabled: true,
          annualEnabled: true,
        })
        .returning({
          id: pricingTables.id,
          name: pricingTables.name,
          monthlyEnabled: pricingTables.monthlyEnabled,
          annualEnabled: pricingTables.annualEnabled,
        })
    )[0]
    const res = await stripeTestHandler(handler, {
      method: 'POST',
      body: {
        account_id: account.stripeId,
        mode: 'live',
      },
    })

    expect(res._getStatusCode()).toBe(200)
    const data = res._getJSONData()
    expect(data).toStrictEqual([pricingTable])
  })
})
