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
      '/stripe/get_customer_features',
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
    await client.createCustomerFlagFeature(
      decoy.stripeId,
      'Decoy',
      'decoy',
      true,
    )

    const account = await client.createTestStripeAccount()
    const customer = await client.createTestStripeCustomer(account.stripeId)
    const cf1 = await client.createCustomerFlagFeature(
      account.stripeId,
      'Feature',
      'feature',
      true,
      customer,
    )
    const cf2 = await client.createCustomerFlagFeature(
      account.stripeId,
      'Feature 2',
      'feature_2',
      false,
      customer,
    )

    const res = await client.stripeRequest('/stripe/get_customer_features', {
      method: 'POST',
      body: JSON.stringify({
        account_id: account.stripeId,
        customer_id: customer.stripeId,
      }),
    })

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({
      data: [
        {
          id: cf1.id,
          feature_id: cf1.featureId,
          value_flag: cf1.valueFlag,
          value_limit: cf1.valueLimit,
          name: 'Feature',
        },
        {
          id: cf2.id,
          feature_id: cf2.featureId,
          value_flag: cf2.valueFlag,
          value_limit: cf2.valueLimit,
          name: 'Feature 2',
        },
      ],
    })
  })
})
