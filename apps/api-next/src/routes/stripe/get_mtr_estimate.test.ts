/**
 * @jest-environment node
 */

import app from '@/index'
import { MOCK_ENV, TestClient, genStripeId } from '@/lib/test/client'
import { schema, eq } from '@spackle/db'
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
      '/stripe/get_mtr_estimate',
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

  test('Returns mtr based on last 30 days of usage', async () => {
    const account = await client.createTestStripeAccount()
    const yesterday = new Date(new Date().setDate(new Date().getDate() - 1))
    await client.createTestBillableCharge(
      account.stripeId,
      100,
      yesterday,
      0,
      'succeeded',
    )
    await client.createTestBillableCharge(
      account.stripeId,
      100,
      yesterday,
      0,
      'succeeded',
    )
    await client.createTestBillableCharge(
      account.stripeId,
      100,
      yesterday,
      0,
      'succeeded',
    )

    // Ignores failed
    await client.createTestBillableCharge(
      account.stripeId,
      500,
      yesterday,
      0,
      'failed',
    )

    // Ignores outside date range
    const thirtyOneDaysAgo = new Date(
      new Date().setDate(new Date().getDate() - 31),
    )
    await client.createTestBillableCharge(
      account.stripeId,
      600,
      thirtyOneDaysAgo,
      0,
      'succeeded',
    )

    // Ignores test mode
    await client.createTestBillableCharge(
      account.stripeId,
      700,
      yesterday,
      1,
      'succeeded',
    )

    // Ignores charges without invoice
    await client.createTestStripeCharge(
      account.stripeId,
      {},
      'succeeded',
      800,
      yesterday,
      null,
      0,
    )

    // Ignores charges without subscription
    const invoice = await client.createTestStripeInvoice(
      account.stripeId,
      null,
      {},
    )
    await client.createTestStripeCharge(
      account.stripeId,
      {},
      'succeeded',
      900,
      yesterday,
      invoice.stripeId,
      0,
    )

    const res = await client.stripeRequest('/stripe/get_mtr_estimate', {
      method: 'POST',
      body: JSON.stringify({
        account_id: account.stripeId,
      }),
    })
    expect(await res.json()).toEqual({
      mtr: 3,
    })
  })
})
