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

test('Requires an API token', async () => {
  const res = await app.request(
    '/customer_features',
    {
      method: 'GET',
      headers: {},
    },
    MOCK_ENV,
  )

  expect(res.status).toBe(401)
  expect(await res.json()).toEqual({
    error: 'Unauthorized',
  })
})

test('Requires a non-publishable API token', async () => {
  const { token } = await client.createTestAccountWithPublishableToken()
  const res = await app.request(
    '/customer_features',
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token.token}`,
      },
    },
    MOCK_ENV,
  )

  expect(res.status).toBe(403)
  expect(await res.json()).toEqual({
    error: 'Forbidden',
  })
})

test('Invalid methods return a 405 error', async () => {
  const { token } = await client.createTestAccountWithToken()
  const res = await app.request(
    '/customer_features',
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token.token}`,
      },
    },
    MOCK_ENV,
  )

  expect(res.status).toBe(405)
})

describe('List', () => {
  test('Returns a list of customer features', async () => {
    const { account, token } = await client.createTestAccountWithToken()

    const customerFeatures = []
    for (let i = 0; i < 5; i++) {
      const customerFeature = await client.createTestCustomerFlagFeature(
        account.stripeId,
        `Feature ${i}`,
        `feature_${i}`,
        false,
      )
      customerFeatures.push(customerFeature)
    }

    const res = await app.request(
      '/customer_features',
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token.token}`,
        },
      },
      MOCK_ENV,
    )

    expect(await res.json()).toEqual({
      data: customerFeatures.map((customerFeature) => ({
        created_at: customerFeature.createdAt,
        feature_id: customerFeature.featureId,
        id: customerFeature.id,
        stripe_customer_id: customerFeature.stripeCustomerId,
        value_flag: customerFeature.valueFlag,
        value_limit: customerFeature.valueLimit,
      })),
      has_more: false,
    })
  })
})

describe('Pagination', () => {
  test('Returns a paginated list of features', async () => {
    const { account, token } = await client.createTestAccountWithToken()

    const customerFeatures = []
    for (let i = 0; i < 11; i++) {
      const customerFeature = await client.createTestCustomerFlagFeature(
        account.stripeId,
        `Feature ${i}`,
        `feature_${i}`,
        false,
      )
      customerFeatures.push(customerFeature)
    }

    const res = await app.request(
      '/customer_features',
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token.token}`,
        },
      },
      MOCK_ENV,
    )

    expect(await res.json()).toEqual({
      data: customerFeatures.slice(0, 10).map((customerFeature) => ({
        created_at: customerFeature.createdAt,
        feature_id: customerFeature.featureId,
        id: customerFeature.id,
        stripe_customer_id: customerFeature.stripeCustomerId,
        value_flag: customerFeature.valueFlag,
        value_limit: customerFeature.valueLimit,
      })),
      has_more: true,
    })
  })

  test('Page parameters', async () => {
    const { account, token } = await client.createTestAccountWithToken()

    const customerFeatures = []
    for (let i = 0; i < 11; i++) {
      const customerFeature = await client.createTestCustomerFlagFeature(
        account.stripeId,
        `Feature ${i}`,
        `feature_${i}`,
        false,
      )
      customerFeatures.push(customerFeature)
    }

    const res = await app.request(
      `/customer_features?page=2`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token.token}`,
        },
      },
      MOCK_ENV,
    )

    expect(await res.json()).toEqual({
      data: customerFeatures.slice(10, 11).map((customerFeature) => ({
        created_at: customerFeature.createdAt,
        feature_id: customerFeature.featureId,
        id: customerFeature.id,
        stripe_customer_id: customerFeature.stripeCustomerId,
        value_flag: customerFeature.valueFlag,
        value_limit: customerFeature.valueLimit,
      })),
      has_more: false,
    })
  })
})

describe('Create', () => {
  test('Creates a new feature', async () => {
    const { account, token } = await client.createTestAccountWithToken()
    const customer = await client.createTestStripeCustomer(account.stripeId)
    const feature = await client.createTestFlagFeature(
      account.stripeId,
      'Feature 1',
      'feature_1',
      false,
    )
    const res = await app.request(
      '/customer_features',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token.token}`,
        },
        body: JSON.stringify({
          stripe_customer_id: customer.stripeId,
          feature_id: feature.id,
          value_flag: true,
        }),
      },
      MOCK_ENV,
    )
    expect(res.status).toBe(201)
    const data = await res.json()
    expect(data).toEqual({
      created_at: expect.any(String),
      feature_id: feature.id,
      id: expect.any(Number),
      stripe_customer_id: customer.stripeId,
      value_flag: true,
      value_limit: null,
    })
  })

  test('Validates field schema for flag', async () => {
    const { account, token } = await client.createTestAccountWithToken()
    const customer = await client.createTestStripeCustomer(account.stripeId)
    const feature = await client.createTestFlagFeature(
      account.stripeId,
      'Feature 1',
      'feature_1',
      false,
    )
    const res = await app.request(
      '/customer_features',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token.token}`,
        },
        body: JSON.stringify({
          stripe_customer_id: customer.stripeId,
          feature_id: feature.id,
        }),
      },
      MOCK_ENV,
    )
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
    const customer = await client.createTestStripeCustomer(account.stripeId)
    const feature = await client.createTestLimitFeature(
      account.stripeId,
      'Feature 1',
      'feature_1',
      100,
    )
    const res = await app.request(
      '/customer_features',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token.token}`,
        },
        body: JSON.stringify({
          stripe_customer_id: customer.stripeId,
          feature_id: feature.id,
        }),
      },
      MOCK_ENV,
    )
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({
      error: {
        formErrors: ['Invalid input'],
        fieldErrors: {},
      },
    })
  })
})
