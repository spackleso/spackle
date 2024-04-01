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
  const res = await client.request('/features', {
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
  const res = await client.request('/features', {
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
  const res = await client.request('/features', {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token.token}`,
    },
  })

  expect(res.status).toBe(405)
})

describe('List', () => {
  test('Returns a list of features', async () => {
    const { account, token } = await client.createTestAccountWithToken()

    const features = []
    for (let i = 0; i < 5; i++) {
      const feature = await client.createTestFlagFeature(
        account.stripeId,
        `Feature ${i}`,
        `feature_${i}`,
        false,
      )
      features.push(feature)
    }

    const res = await client.request('/features', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token.token}`,
      },
    })

    expect(await res.json()).toEqual({
      data: features.map((feature) => ({
        created_at: feature.createdAt,
        id: feature.id,
        key: feature.key,
        name: feature.name,
        type: feature.type,
        value_flag: feature.valueFlag,
        value_limit: feature.valueLimit,
      })),
      has_more: false,
    })
  })

  describe('Pagination', () => {
    test('Returns a paginated list of features', async () => {
      const { account, token } = await client.createTestAccountWithToken()

      const features = []
      for (let i = 0; i < 11; i++) {
        const feature = await client.createTestFlagFeature(
          account.stripeId,
          `Feature ${i}`,
          `feature_${i}`,
          false,
        )
        features.push(feature)
      }

      const res = await client.request('/features', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token.token}`,
        },
      })

      expect(await res.json()).toEqual({
        data: features.slice(0, 10).map((feature) => ({
          created_at: feature.createdAt,
          id: feature.id,
          key: feature.key,
          name: feature.name,
          type: feature.type,
          value_flag: feature.valueFlag,
          value_limit: feature.valueLimit,
        })),
        has_more: true,
      })
    })

    test('Page parameters', async () => {
      const { account, token } = await client.createTestAccountWithToken()

      const features = []
      for (let i = 0; i < 11; i++) {
        const feature = await client.createTestFlagFeature(
          account.stripeId,
          `Feature ${i}`,
          `feature_${i}`,
          false,
        )
        features.push(feature)
      }

      const res = await client.request('/features?page=2', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token.token}`,
        },
      })

      expect(await res.json()).toEqual({
        data: features.slice(10, 11).map((feature) => ({
          created_at: feature.createdAt,
          id: feature.id,
          key: feature.key,
          name: feature.name,
          type: feature.type,
          value_flag: feature.valueFlag,
          value_limit: feature.valueLimit,
        })),
        has_more: false,
      })
    })
  })
})

describe('Create', () => {
  test('Creates a new feature', async () => {
    const { account, token } = await client.createTestAccountWithToken()
    const res = await client.request('/features', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token.token}`,
      },
      body: JSON.stringify({
        name: 'Feature 1',
        key: 'feature_1',
        type: 0,
        value_flag: false,
        value_limit: null,
      }),
    })
    expect(res.status).toBe(201)
    const data = await res.json()
    expect(data).toEqual({
      created_at: expect.any(String),
      id: expect.any(Number),
      key: 'feature_1',
      name: 'Feature 1',
      type: 0,
      value_flag: false,
      value_limit: null,
    })
  })

  test('Validates field schema for flag', async () => {
    const { token } = await client.createTestAccountWithToken()
    const res = await client.request('/features', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token.token}`,
      },
      body: JSON.stringify({
        type: 0,
      }),
    })
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({
      error: {
        formErrors: [],
        fieldErrors: {
          name: ['Required'],
          key: ['Required'],
          value_flag: ['Required'],
        },
      },
    })
  })

  test('Validates field schema for limit', async () => {
    const { token } = await client.createTestAccountWithToken()
    const res = await client.request('/features', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token.token}`,
      },
      body: JSON.stringify({
        type: 1,
      }),
    })
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({
      error: {
        formErrors: [],
        fieldErrors: {
          name: ['Required'],
          key: ['Required'],
          value_limit: ['Required'],
        },
      },
    })
  })
})

describe('Retrieve', () => {
  test('Returns a feature via id', async () => {
    const { account, token } = await client.createTestAccountWithToken()

    const feature = await client.createTestFlagFeature(
      account.stripeId,
      'Feature',
      'feature',
      false,
    )

    const res = await client.request(`/features/${feature.id}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token.token}`,
      },
    })

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({
      created_at: feature.createdAt,
      id: feature.id,
      key: feature.key,
      name: feature.name,
      type: feature.type,
      value_flag: feature.valueFlag,
      value_limit: feature.valueLimit,
    })
  })

  test('Returns a feature via key', async () => {
    const { account, token } = await client.createTestAccountWithToken()

    const feature = await client.createTestFlagFeature(
      account.stripeId,
      'Feature',
      'feature',
      false,
    )

    const res = await client.request(`/features/${feature.key}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token.token}`,
      },
    })

    expect(await res.json()).toEqual({
      created_at: feature.createdAt,
      id: feature.id,
      key: feature.key,
      name: feature.name,
      type: feature.type,
      value_flag: feature.valueFlag,
      value_limit: feature.valueLimit,
    })
  })

  test("Returns 404 if querying a different account's feature", async () => {
    const { account, token } = await client.createTestAccountWithToken()
    const { account: otherAccount, token: otherToken } =
      await client.createTestAccountWithToken()

    const feature = await client.createTestFlagFeature(
      otherAccount.stripeId,
      'Feature',
      'feature',
      false,
    )

    const res = await client.request(`/features/${feature.id}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token.token}`,
      },
    })

    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({
      error: 'Not found',
    })
  })
})
