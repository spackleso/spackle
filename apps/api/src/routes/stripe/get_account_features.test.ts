/**
 * @jest-environment node
 */

import app from '@/index'
import { MOCK_ENV, TestClient } from '@/lib/test/client'
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
      '/stripe/get_account_features',
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

  test('Returns customer features', async () => {
    const decoy = await client.createTestStripeAccount()
    await client.createTestFlagFeature(decoy.stripeId, 'Decoy', 'decoy', true)

    const account = await client.createTestStripeAccount()
    const f1 = await client.createTestFlagFeature(
      account.stripeId,
      'Feature',
      'feature',
      true,
    )
    const f2 = await client.createTestFlagFeature(
      account.stripeId,
      'Feature 2',
      'feature_2',
      false,
    )

    const res = await client.stripeRequest('/stripe/get_account_features', {
      method: 'POST',
      body: JSON.stringify({
        account_id: account.stripeId,
      }),
    })

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({
      data: [
        {
          id: f1.id,
          key: f1.key,
          value_flag: f1.valueFlag,
          value_limit: f1.valueLimit,
          name: 'Feature',
          type: f1.type,
        },
        {
          id: f2.id,
          key: f2.key,
          value_flag: f2.valueFlag,
          value_limit: f2.valueLimit,
          name: 'Feature 2',
          type: f2.type,
        },
      ],
    })
  })
})
