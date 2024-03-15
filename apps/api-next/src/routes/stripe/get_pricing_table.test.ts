/**
 * @jest-environment node
 */
import app from '@/index'
import { MOCK_ENV, TestClient } from '@/lib/test/client'
import { eq, schema } from '@spackle/db'

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
      '/stripe/get_pricing_table',
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

  test('Returns a 404 if the pricing table does not exist', async () => {
    const account = await client.createTestStripeAccount()
    const res = await client.stripeRequest('/stripe/get_pricing_table', {
      method: 'POST',
      body: JSON.stringify({
        account_id: account.stripeId,
        mode: 'live',
        pricing_table_id: '123',
      }),
    })

    expect(res.status).toBe(404)
  })

  test('Returns a pricing table', async () => {
    const account = await client.createTestStripeAccount()
    const pricingTableId = (
      await client.createTestPricingTable(
        account.stripeId,
        'Default',
        0,
        true,
        true,
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
    const res = await client.stripeRequest('/stripe/get_pricing_table', {
      method: 'POST',
      body: JSON.stringify({
        account_id: account.stripeId,
        mode: 'live',
        pricing_table_id: pricingTable.id,
      }),
    })

    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data).toEqual({
      id: pricingTable.id,
      name: 'Default',
      mode: 0,
      monthly_enabled: true,
      annual_enabled: true,
    })
  })
})
