/**
 * @jest-environment node
 */
import {
  createAccountWithPublishableToken,
  createAccountWithToken,
  createFlagFeature,
  createStripeCustomer,
  testHandler,
} from '@/tests/helpers'
import handler from '@/pages/api/v1/customers/[id]/state'
import { storeCustomerStateAsync } from '@/store/dynamodb'

jest.mock('@/store/dynamodb', () => {
  return {
    __esModule: true,
    storeCustomerStateAsync: jest.fn(() => Promise.resolve()),
  }
})

jest.mock('@/queue', () => {
  return {
    __esModule: true,
  }
})

test('Requires an API token', async () => {
  const res = await testHandler(handler, {
    method: 'GET',
    body: {},
  })

  expect(res._getStatusCode()).toBe(401)
  expect(res._getData()).toBe(
    JSON.stringify({
      error: 'Unauthorized',
    }),
  )
})

test('Requires a non-publishable API token', async () => {
  const { token } = await createAccountWithPublishableToken()
  const res = await testHandler(handler, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token.token}`,
    },
    body: {},
  })

  expect(res._getStatusCode()).toBe(403)
  expect(res._getData()).toBe(
    JSON.stringify({
      error: 'Forbidden',
    }),
  )
})

test('Invalid methods return a 405 error', async () => {
  const { token } = await createAccountWithToken()
  const res = await testHandler(handler, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token.token}`,
    },
    body: {},
  })

  expect(res._getStatusCode()).toBe(405)
})

test('Returns a 404 if the customer does not exist', async () => {
  const { token } = await createAccountWithToken()
  const res = await testHandler(handler, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token.token}`,
    },
    query: {
      id: 'cus_123',
    },
  })

  expect(res._getStatusCode()).toBe(404)
})

test('Returns a 404 if the customer does not belong to the account', async () => {
  const { token } = await createAccountWithToken()
  const { account: otherAccount } = await createAccountWithToken()
  const customer = await createStripeCustomer(otherAccount.stripeId)

  const res = await testHandler(handler, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token.token}`,
    },
    query: {
      id: customer.stripeId,
    },
  })

  expect(res._getStatusCode()).toBe(404)
})

test('Returns a customer state', async () => {
  const { account, token } = await createAccountWithToken()
  const customer = await createStripeCustomer(account.stripeId)
  const feature = await createFlagFeature(
    account.stripeId,
    `Feature 1`,
    `feature_1`,
    false,
  )

  const res = await testHandler(handler, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token.token}`,
    },
    query: {
      id: customer.stripeId,
    },
  })

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
          value_flag: feature.valueFlag,
          value_limit: feature.valueLimit,
        },
      ],
      subscriptions: [],
    }),
  )
  expect(storeCustomerStateAsync).toHaveBeenCalledWith(
    account.stripeId,
    customer.stripeId,
  )
})
