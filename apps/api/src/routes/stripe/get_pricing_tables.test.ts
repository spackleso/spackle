/**
 * @jest-environment node
 */
import app from '@/index'
import { TestClient } from '@/lib/test/client'
import { eq, schema } from '@spackle/db'
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
    const res = await client.request('/stripe/get_pricing_tables', {
      method: 'POST',
      body: JSON.stringify({}),
    })

    expect(res.status).toBe(403)
    expect(await res.json()).toEqual({
      error: 'Unauthorized',
    })
  })

  test('Creates a default pricing table', async () => {
    const account = await client.createTestStripeAccount()
    const res = await client.stripeRequest('/stripe/get_pricing_tables', {
      method: 'POST',
      body: JSON.stringify({
        account_id: account.stripeId,
        mode: 'live',
      }),
    })

    expect(res.status).toBe(200)
    const data = (await res.json()) as any
    expect(data.length).toBe(1)
    const { id, ...pricingTable } = data[0]
    expect(id).toBeDefined()
    expect(pricingTable).toEqual({
      name: 'Default',
      mode: 0,
      monthly_enabled: false,
      annual_enabled: false,
    })
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
    const res = await client.stripeRequest('/stripe/get_pricing_tables', {
      method: 'POST',
      body: JSON.stringify({
        account_id: account.stripeId,
        mode: 'live',
      }),
    })

    expect(res.status).toBe(200)
    const data = (await res.json()) as any
    expect(data).toEqual([
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
