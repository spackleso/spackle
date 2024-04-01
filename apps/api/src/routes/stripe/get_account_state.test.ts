/**
 * @jest-environment node
 */
import app from '@/index'
import { TestClient } from '@/lib/test/client'
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
    const res = await client.request('/stripe/get_account_state', {
      method: 'POST',
      body: JSON.stringify({}),
    })

    expect(res.status).toBe(403)
    expect(await res.json()).toEqual({
      error: 'Unauthorized',
    })
  })

  test('Returns the account features state', async () => {
    const account = await client.createTestStripeAccount()
    const feature = await client.createTestFlagFeature(
      account.stripeId,
      'Test',
      'test',
      false,
    )

    const res = await client.stripeRequest('/stripe/get_account_state', {
      method: 'POST',
      body: JSON.stringify({
        account_id: account.stripeId,
        mode: 'test',
      }),
    })

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({
      data: [
        {
          id: feature.id,
          name: 'Test',
          key: 'test',
          type: 0,
          value_flag: false,
          value_limit: null,
        },
      ],
    })
  })
})
