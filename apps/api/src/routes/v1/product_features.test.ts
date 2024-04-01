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

test('Requires an API token', async () => {
  const res = await client.request('/product_features', {
    method: 'GET',
    headers: {},
  })

  expect(res.status).toBe(401)
  expect(await res.json()).toEqual({
    error: 'Unauthorized',
  })
})

test('Requires a non-publishable API token', async () => {
  const { token } = await client.createTestAccountWithPublishableToken()
  const res = await client.request('/product_features', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token.token}`,
    },
  })

  expect(res.status).toBe(403)
  expect(await res.json()).toEqual({
    error: 'Forbidden',
  })
})

test('Invalid methods return a 405 error', async () => {
  const { token } = await client.createTestAccountWithToken()
  const res = await client.request('/product_features', {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token.token}`,
    },
  })

  expect(res.status).toBe(405)
})

describe('List', () => {
  test('Returns a list of product features', async () => {
    const { account, token } = await client.createTestAccountWithToken()

    const productFeatures = []
    for (let i = 0; i < 5; i++) {
      const productFeature = await client.createTestProductFeature(
        account.stripeId,
        false,
        {
          name: `Feature ${i}`,
          key: `feature_${i}`,
        },
      )
      productFeatures.push(productFeature)
    }

    const res = await client.request('/product_features', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token.token}`,
      },
    })

    expect(await res.json()).toEqual({
      data: productFeatures.map((productFeature) => ({
        created_at: productFeature.createdAt,
        feature_id: productFeature.featureId,
        id: productFeature.id,
        stripe_product_id: productFeature.stripeProductId,
        value_flag: productFeature.valueFlag,
        value_limit: productFeature.valueLimit,
      })),
      has_more: false,
    })
  })

  describe('Pagination', () => {
    test('Returns a paginated list of features', async () => {
      const { account, token } = await client.createTestAccountWithToken()

      const productFeatures = []
      for (let i = 0; i < 11; i++) {
        const productFeature = await client.createTestProductFeature(
          account.stripeId,
          false,
          {
            name: `Feature ${i}`,
            key: `feature_${i}`,
          },
        )
        productFeatures.push(productFeature)
      }

      const res = await client.request('/product_features', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token.token}`,
        },
      })

      expect(await res.json()).toEqual({
        data: productFeatures.slice(0, 10).map((productFeature) => ({
          created_at: productFeature.createdAt,
          feature_id: productFeature.featureId,
          id: productFeature.id,
          stripe_product_id: productFeature.stripeProductId,
          value_flag: productFeature.valueFlag,
          value_limit: productFeature.valueLimit,
        })),
        has_more: true,
      })
    })

    test('Page parameters', async () => {
      const { account, token } = await client.createTestAccountWithToken()

      const productFeatures = []
      for (let i = 0; i < 11; i++) {
        const productFeature = await client.createTestProductFeature(
          account.stripeId,
          false,
          {
            name: `Feature ${i}`,
            key: `feature_${i}`,
          },
        )
        productFeatures.push(productFeature)
      }

      const res = await client.request('/product_features?page=2', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token.token}`,
        },
      })

      expect(await res.json()).toEqual({
        data: productFeatures.slice(10, 11).map((productFeature) => ({
          created_at: productFeature.createdAt,
          feature_id: productFeature.featureId,
          id: productFeature.id,
          stripe_product_id: productFeature.stripeProductId,
          value_flag: productFeature.valueFlag,
          value_limit: productFeature.valueLimit,
        })),
        has_more: false,
      })
    })
  })
})

describe('POST', () => {
  test('Creates a new feature', async () => {
    const { account, token } = await client.createTestAccountWithToken()
    const product = await client.createTestStripeProduct(account.stripeId)
    const feature = await client.createTestFlagFeature(
      account.stripeId,
      'Feature 1',
      'feature_1',
      false,
    )
    const res = await client.request('/product_features', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token.token}`,
      },
      body: JSON.stringify({
        stripe_product_id: product.stripeId,
        feature_id: feature.id,
        value_flag: true,
      }),
    })

    expect(res.status).toBe(201)
    const data = await res.json()
    expect(data).toEqual({
      created_at: expect.any(String),
      feature_id: feature.id,
      id: expect.any(Number),
      stripe_product_id: product.stripeId,
      value_flag: true,
      value_limit: null,
    })
  })

  test('Validates field schema for flag', async () => {
    const { account, token } = await client.createTestAccountWithToken()
    const product = await client.createTestStripeProduct(account.stripeId)
    const feature = await client.createTestFlagFeature(
      account.stripeId,
      'Feature 1',
      'feature_1',
      false,
    )
    const res = await client.request('/product_features', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token.token}`,
      },
      body: JSON.stringify({
        stripe_product_id: product.stripeId,
        feature_id: feature.id,
      }),
    })
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({
      error: {
        formErrors: ['Invalid input'],
        fieldErrors: {},
      },
    })
  })

  test('Validates field schema for limit', async () => {
    const { account, token } = await client.createTestAccountWithToken()
    const product = await client.createTestStripeProduct(account.stripeId)
    const feature = await client.createTestLimitFeature(
      account.stripeId,
      'Feature 1',
      'feature_1',
      100,
    )
    const res = await client.request('/product_features', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token.token}`,
      },
      body: JSON.stringify({
        stripe_product_id: product.stripeId,
        feature_id: feature.id,
      }),
    })
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({
      error: {
        formErrors: ['Invalid input'],
        fieldErrors: {},
      },
    })
  })
})
