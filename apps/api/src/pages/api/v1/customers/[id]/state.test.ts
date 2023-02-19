import {
  createAccountWithToken,
  createFlagFeature,
  createStripeCustomer,
} from '@/tests/helpers'
import { createMocks } from 'node-mocks-http'
import handler from '@/pages/api/v1/customers/[id]/state'
import { storeCustomerStateAsync } from '@/store/dynamodb'

jest.mock('@/store/dynamodb', () => {
  return {
    __esModule: true,
    storeCustomerStateAsync: jest.fn(() => Promise.resolve()),
  }
})

test('Requires an API token', async () => {
  const { req, res } = createMocks({
    method: 'GET',
    body: {},
  })

  await handler(req, res)
  expect(res._getStatusCode()).toBe(403)
  expect(res._getData()).toBe(
    JSON.stringify({
      error: 'Unauthorized',
    }),
  )
})

test('Invalid methods return a 405 error', async () => {
  const { token } = await createAccountWithToken()
  const { req, res } = createMocks({
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token.token}`,
    },
    body: {},
  })

  await handler(req, res)
  expect(res._getStatusCode()).toBe(405)
})

test('Returns a 404 if the customer does not exist', async () => {
  const { token } = await createAccountWithToken()
  const { req, res } = createMocks({
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token.token}`,
    },
    query: {
      id: 'cus_123',
    },
  })

  await handler(req, res)
  expect(res._getStatusCode()).toBe(404)
})

test('Returns a 404 if the customer does not belong to the account', async () => {
  const { token } = await createAccountWithToken()
  const { account: otherAccount } = await createAccountWithToken()
  const customer = await createStripeCustomer(otherAccount.stripe_id)

  const { req, res } = createMocks({
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token.token}`,
    },
    query: {
      id: customer.stripe_id,
    },
  })

  await handler(req, res)
  expect(res._getStatusCode()).toBe(404)
})

test('Returns a customer state', async () => {
  const { account, token } = await createAccountWithToken()
  const customer = await createStripeCustomer(account.stripe_id)
  const feature = await createFlagFeature(
    account.stripe_id,
    `Feature 1`,
    `feature_1`,
    false,
  )

  const { req, res } = createMocks({
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token.token}`,
    },
    query: {
      id: customer.stripe_id,
    },
  })

  await handler(req, res)
  expect(res._getStatusCode()).toBe(200)
  expect(res._getData()).toBe(
    JSON.stringify({
      version: 1,
      features: [
        {
          id: feature.id,
          name: feature.name,
          key: feature.key,
          type: feature.type,
          value_flag: feature.value_flag,
          value_limit: feature.value_limit,
        },
      ],
      subscriptions: [],
    }),
  )
  expect(storeCustomerStateAsync).toHaveBeenCalledWith(
    account.stripe_id,
    customer.stripe_id,
  )
})
