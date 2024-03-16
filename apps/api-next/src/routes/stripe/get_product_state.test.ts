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
      '/stripe/get_product_state',
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

  test('Returns the product features state', async () => {
    const account = await client.createTestStripeAccount()
    const product = await client.createTestStripeProduct(account.stripeId)
    const feature = await client.createTestFlagFeature(
      account.stripeId,
      'Test',
      'test',
      false,
    )

    const res = await client.stripeRequest('/stripe/get_product_state', {
      method: 'POST',
      body: JSON.stringify({
        account_id: account.stripeId,
        product_id: product.stripeId,
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
