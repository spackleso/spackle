/**
 * @jest-environment node
 */
import app from '@/index'
import { MOCK_ENV, TestClient } from '@/lib/test/client'
import { schema } from '@spackle/db'
import { eq } from 'drizzle-orm'

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
      '/stripe/acknowledge_setup',
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

  test("Silent update if account doesn't exist", async () => {
    const res = await client.stripeRequest('/stripe/acknowledge_setup', {
      method: 'POST',
      body: JSON.stringify({}),
    })

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({
      success: true,
    })
  })

  test('Acknowledges account setup', async () => {
    const account = await client.createTestStripeAccount()
    expect(account.hasAcknowledgedSetup).toBe(false)
    const res = await client.stripeRequest('/stripe/acknowledge_setup', {
      method: 'POST',
      body: JSON.stringify({
        account_id: account.stripeId,
      }),
    })

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({
      success: true,
    })

    const updatedAccount = await client.db.query.stripeAccounts.findFirst({
      where: eq(schema.stripeAccounts.stripeId, account.stripeId),
    })
    expect(updatedAccount!.hasAcknowledgedSetup).toBe(true)
  })
})
