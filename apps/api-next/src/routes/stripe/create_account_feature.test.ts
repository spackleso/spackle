/**
 * @jest-environment node
 */

import app from '@/index'
import { MOCK_ENV, TestClient } from '@/lib/test/client'
import { schema, eq } from '@spackle/db'

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
      '/stripe/create_account_feature',
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

  test('Creates a new feature', async () => {
    const account = await client.createTestStripeAccount()
    const res = await client.stripeRequest('/stripe/create_account_feature', {
      method: 'POST',
      body: JSON.stringify({
        account_id: account.stripeId,
        name: 'Test',
        key: 'test',
        type: 0,
        value_flag: false,
        value_limit: null,
      }),
    })

    expect(res.status).toBe(201)

    const result = await client.db
      .select()
      .from(schema.features)
      .where(eq(schema.features.stripeAccountId, account.stripeId))

    expect(result.length).toBe(1)
  })
})
