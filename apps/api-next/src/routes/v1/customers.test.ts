/**
 * @jest-environment node
 */
import app from '@/index'
import { MOCK_ENV, TestClient } from '@/lib/test/client'
import { beforeAll, afterAll, test, expect } from 'vitest'

let client: TestClient
beforeAll(async () => {
  client = new TestClient(app)
})
afterAll(async () => {
  await client.teardown()
})

test('Requires an API token', async () => {
  const res = await app.request(
    '/customers/123/state',
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
    '/customers/123/state',
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
    '/customers/123/state',
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

test('Returns a 404 if the customer does not exist', async () => {
  const { token } = await client.createTestAccountWithToken()
  const res = await app.request(
    '/customers/123/state',
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token.token}`,
      },
    },
    MOCK_ENV,
  )

  expect(res.status).toBe(404)
})

test('Returns a 404 if the customer does not belong to the account', async () => {
  const { token } = await client.createTestAccountWithToken()
  const { account: otherAccount } = await client.createTestAccountWithToken()
  const customer = await client.createTestStripeCustomer(otherAccount.stripeId)

  const res = await app.request(
    `/customers/${customer.stripeId}/state`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token.token}`,
      },
    },
    MOCK_ENV,
  )

  expect(res.status).toBe(404)
})

test('Returns a customer state', async () => {
  const { account, token } = await client.createTestAccountWithToken()
  const customer = await client.createTestStripeCustomer(account.stripeId)
  const feature = await client.createTestFlagFeature(
    account.stripeId,
    `Feature 1`,
    `feature_1`,
    false,
  )

  const res = await app.request(
    `/customers/${customer.stripeId}/state`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token.token}`,
      },
    },
    MOCK_ENV,
  )

  expect(res.status).toBe(200)
  expect(await res.json()).toEqual({
    version: 1,
    features: [
      {
        id: feature.id,
        name: feature.name,
        key: feature.key,
        type: feature.type,
        value_flag: feature.valueFlag,
        value_limit: feature.valueLimit,
      },
    ],
    subscriptions: [],
  })

  const cachedRes = await app.request(
    `/customers/${customer.stripeId}/state`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token.token}`,
      },
    },
    MOCK_ENV,
  )

  expect(cachedRes.status).toBe(200)
  expect(await cachedRes.json()).toEqual({
    version: 1,
    features: [
      {
        id: feature.id,
        name: feature.name,
        key: feature.key,
        type: feature.type,
        value_flag: feature.valueFlag,
        value_limit: feature.valueLimit,
      },
    ],
    subscriptions: [],
  })
})
