/**
 * @jest-environment node
 */
import handler from '@/pages/api/stripe/delete_pricing_table'
import {
  createAccount,
  createPricingTable,
  stripeTestHandler,
  testHandler,
} from '@/tests/helpers'
import { eq } from 'drizzle-orm'
import db, { encodePk, pricingTables } from '@/db'

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

  test('Deletes a pricing table', async () => {
    const account = await createAccount()
    const pricingTableId = (
      await createPricingTable(
        account.stripeId,
        'Pricing Table',
        0,
        false,
        false,
      )
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
        id: pricingTable.id,
      },
    })

    expect(res._getStatusCode()).toBe(200)
    const result = await db
      .select()
      .from(pricingTables)
      .where(eq(pricingTables.id, pricingTableId))
    expect(result.length).toBe(0)
  })
})
