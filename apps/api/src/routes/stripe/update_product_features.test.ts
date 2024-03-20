/**
 * @jest-environment node
 */

import app from '@/index'
import { MOCK_ENV, TestClient } from '@/lib/test/client'
import { eq, schema } from '@spackle/db'
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
      '/stripe/update_product_features',
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

  test('Creates, updates, and deletes product features based on client state', async () => {
    const account = await client.createTestStripeAccount()
    const product = await client.createTestStripeProduct(account.stripeId)
    const createdFeature = await client.createTestFlagFeature(
      account.stripeId,
      'Created',
      'created',
      false,
    )
    const updatedProductFeature = await client.createTestProductFeature(
      account.stripeId,
      false,
      {
        name: 'Updated',
        key: 'updated',
        product,
      },
    )

    await client.createTestProductFeature(account.stripeId, false, {
      name: 'Delete',
      key: 'delete',
      product,
    })

    const res = await client.stripeRequest('/stripe/update_product_features', {
      method: 'POST',
      body: JSON.stringify({
        account_id: account.stripeId,
        product_id: product.stripeId,
        product_features: [
          {
            feature_id: createdFeature.id,
            value_limit: null,
            value_flag: true,
          },
          {
            id: updatedProductFeature.id,
            feature_id: updatedProductFeature.featureId,
            value_limit: null,
            value_flag: true,
          },
        ],
      }),
    })

    expect(res.status).toBe(200)

    const pfs = await client.db
      .select()
      .from(schema.productFeatures)
      .where(eq(schema.productFeatures.stripeAccountId, account.stripeId))
      .orderBy(schema.productFeatures.id)

    expect(pfs.length).toBe(2)
    expect(pfs[0]).toStrictEqual({
      createdAt: updatedProductFeature.createdAt,
      featureId: updatedProductFeature.featureId,
      id: updatedProductFeature.id,
      stripeAccountId: account.stripeId,
      stripeProductId: product.stripeId,
      valueFlag: true,
      valueLimit: null,
    })

    expect(pfs[1].featureId).toBe(createdFeature.id)
    expect(pfs[1].stripeAccountId).toBe(account.stripeId)
    expect(pfs[1].stripeProductId).toBe(product.stripeId)
    expect(pfs[1].valueFlag).toBe(true)
    expect(pfs[1].valueLimit).toBe(null)
  })
})
