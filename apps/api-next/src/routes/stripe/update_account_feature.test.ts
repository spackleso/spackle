/**
 * @jest-environment node
 */

import app from '@/index'
import { MOCK_ENV, TestClient } from '@/lib/test/client'
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
      '/stripe/update_account_feature',
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

  test('Updates a feature', async () => {
    const account = await client.createTestStripeAccount()
    const feature = await client.createTestFlagFeature(
      account.stripeId,
      'Test',
      'test',
      false,
    )

    const res = await client.stripeRequest('/stripe/update_account_feature', {
      method: 'POST',
      body: JSON.stringify({
        account_id: account.stripeId,
        id: feature.id,
        name: 'Updated',
        value_flag: true,
        value_limit: null,
      }),
    })

    expect(res.status).toBe(200)

    const result = await client.db
      .select()
      .from(schema.features)
      .where(eq(schema.features.id, feature.id))
    const updatedFeature = result[0]

    expect(updatedFeature.name).toBe('Updated')
    expect(updatedFeature.valueFlag).toBe(true)
  })
})
