/**
 * @jest-environment node
 */
import handler from '@/pages/api/stripe/get_pricing_tables'
import {
  createAccount,
  createPricingTable,
  stripeTestHandler,
  testHandler,
} from '@/tests/helpers'
import { eq } from 'drizzle-orm'
import db, { pricingTables, encodePk } from 'spackle-db'

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
      mode: 0,
      monthly_enabled: false,
      annual_enabled: false,
    })
  })

  test('Returns a pricing table', async () => {
    const account = await createAccount()
    const pricingTableId = (
      await createPricingTable(account.stripeId, 'Default', 0, true, true)
    ).id
    const pricingTable = (
      await db
        .select({
          id: encodePk(pricingTables.id),
          name: pricingTables.name,
          mode: pricingTables.mode,
          monthly_enabled: pricingTables.monthlyEnabled,
          annual_enabled: pricingTables.annualEnabled,
        })
        .from(pricingTables)
        .where(eq(pricingTables.id, pricingTableId))
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
    expect(data).toStrictEqual([
      {
        id: pricingTable.id,
        name: 'Default',
        mode: 0,
        monthly_enabled: true,
        annual_enabled: true,
      },
    ])
  })
})
