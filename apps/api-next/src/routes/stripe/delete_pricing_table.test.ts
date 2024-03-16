/**
 * @jest-environment node
 */

import app from '@/index'
import { MOCK_ENV, TestClient } from '@/lib/test/client'
import { schema, eq } from '@spackle/db'

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
      '/stripe/delete_pricing_table',
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

  test('Deletes a pricing table', async () => {
    const account = await client.createTestStripeAccount()
    const pricingTableId = (
      await client.createTestPricingTable(
        account.stripeId,
        'Pricing Table',
        0,
        false,
        false,
      )
    ).id
    const pricingTable = (
      await client.db
        .select({
          id: client.dbService.encodePk(schema.pricingTables.id),
          name: schema.pricingTables.name,
          mode: schema.pricingTables.mode,
          monthly_enabled: schema.pricingTables.monthlyEnabled,
          annual_enabled: schema.pricingTables.annualEnabled,
        })
        .from(schema.pricingTables)
        .where(eq(schema.pricingTables.id, pricingTableId))
    )[0]
    const res = await client.stripeRequest('/stripe/delete_pricing_table', {
      method: 'POST',
      body: JSON.stringify({
        account_id: account.stripeId,
        id: pricingTable.id,
      }),
    })

    expect(res.status).toBe(200)
    const result = await client.db
      .select()
      .from(schema.pricingTables)
      .where(eq(schema.pricingTables.id, pricingTableId))
    expect(result.length).toBe(0)
  })
})
