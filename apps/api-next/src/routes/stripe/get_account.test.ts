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

  test('Returns an account', async () => {
    const account = await client.createTestStripeAccount()
    const res = await client.stripeRequest('/stripe/get_account', {
      method: 'POST',
      body: JSON.stringify({
        account_id: account.stripeId,
        account_name: 'Account Name',
      }),
    })

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({
      has_acknowledged_setup: false,
      id: account.id,
      initial_sync_complete: false,
      initial_sync_started_at: null,
      stripe_id: account.stripeId,
    })
  })
})
