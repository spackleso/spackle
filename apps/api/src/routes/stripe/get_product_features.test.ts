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
    const res = await client.request('/stripe/get_product_features', {
      method: 'POST',
      body: JSON.stringify({}),
    })

    expect(res.status).toBe(403)
    expect(await res.json()).toEqual({
      error: 'Unauthorized',
    })
  })

  test('Returns product features', async () => {
    const decoy = await client.createTestStripeAccount()
    await client.createTestProductFeature(decoy.stripeId, true, {
      name: 'Decoy',
      key: 'decoy',
    })

    const account = await client.createTestStripeAccount()
    const product = await client.createTestStripeProduct(account.stripeId)
    const pf1 = await client.createTestProductFeature(account.stripeId, true, {
      name: 'Feature',
      key: 'feature',
      product,
    })
    const pf2 = await client.createTestProductFeature(account.stripeId, false, {
      name: 'Feature 2',
      key: 'feature_2',
      product,
    })

    const res = await client.stripeRequest('/stripe/get_product_features', {
      method: 'POST',
      body: JSON.stringify({
        account_id: account.stripeId,
        product_id: product.stripeId,
      }),
    })

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({
      data: [
        {
          id: pf1.id,
          feature_id: pf1.featureId,
          value_flag: pf1.valueFlag,
          value_limit: pf1.valueLimit,
          name: 'Feature',
        },
        {
          id: pf2.id,
          feature_id: pf2.featureId,
          value_flag: pf2.valueFlag,
          value_limit: pf2.valueLimit,
          name: 'Feature 2',
        },
      ],
    })
  })
})
