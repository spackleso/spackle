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
      '/stripe/delete_account_feature',
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

  test('Deletes a feature', async () => {
    const account = await client.createTestStripeAccount()
    const feature = await client.createTestFlagFeature(
      account.stripeId,
      'Feature',
      'feature',
      false,
    )
    const res = await client.stripeRequest('/stripe/delete_account_feature', {
      method: 'POST',
      body: JSON.stringify({
        account_id: account.stripeId,
        feature_id: feature.id,
      }),
    })

    expect(res.status).toBe(200)
    const result = await client.db
      .select()
      .from(schema.features)
      .where(eq(schema.features.id, feature.id))
    expect(result.length).toBe(0)
  })

  test('Does not delete other account features', async () => {
    const decoyAccount = await client.createTestStripeAccount()
    const feature = await client.createTestFlagFeature(
      decoyAccount.stripeId,
      'Feature',
      'feature',
      false,
    )
    const account = await client.createTestStripeAccount()
    const res = await client.stripeRequest('/stripe/delete_account_feature', {
      method: 'POST',
      body: JSON.stringify({
        account_id: account.stripeId,
        feature_id: feature.id,
      }),
    })
    expect(res.status).toBe(200)
    const result = await client.db
      .select()
      .from(schema.features)
      .where(eq(schema.features.id, feature.id))
    expect(result.length).toBe(1)
  })
})
