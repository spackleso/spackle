/**
 * @jest-environment node
 */
import app from '@/index'
import { MOCK_ENV, TestClient } from '@/lib/test/client'

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
    const account = await client.createStripeAccount()
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

    const updatedAccount = await client.getStripeAccount(account.stripeId)
    expect(updatedAccount!.hasAcknowledgedSetup).toBe(true)
  })
})
