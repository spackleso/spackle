import { createMocks } from 'node-mocks-http'
import handler from '@/pages/api/v1/customer_features/index'
import {
  createAccountWithToken,
  createFlagFeature,
  createLimitFeature,
  createCustomerFeature,
  createStripeCustomer,
  createStripeProduct,
} from '@/tests/helpers'
import { storeAccountStatesAsync } from '@/store/dynamodb'

jest.mock('@/store/dynamodb', () => {
  return {
    __esModule: true,
    storeAccountStatesAsync: jest.fn(() => Promise.resolve()),
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

describe('GET', () => {
  test('Returns a list of customer features', async () => {
    const { account, token } = await createAccountWithToken()
    const { req, res } = createMocks({
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token.token}`,
      },
    })

    const customerFeatures = []
    for (let i = 0; i < 5; i++) {
      const customerFeature = await createCustomerFeature(
        account.stripe_id,
        `Feature ${i}`,
        `feature_${i}`,
        false,
      )
      customerFeatures.push(customerFeature)
    }

    await handler(req, res)
    expect(res._getData()).toBe(
      JSON.stringify({
        data: customerFeatures.map((customerFeature) => ({
          created_at: customerFeature.created_at,
          feature_id: customerFeature.feature_id,
          id: customerFeature.id,
          stripe_customer_id: customerFeature.stripe_customer_id,
          value_flag: customerFeature.value_flag,
          value_limit: customerFeature.value_limit,
        })),
        has_more: false,
      }),
    )
  })

  describe('Pagination', () => {
    test('Returns a paginated list of features', async () => {
      const { account, token } = await createAccountWithToken()
      const { req, res } = createMocks({
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token.token}`,
        },
      })

      const customerFeatures = []
      for (let i = 0; i < 11; i++) {
        const customerFeature = await createCustomerFeature(
          account.stripe_id,
          `Feature ${i}`,
          `feature_${i}`,
          false,
        )
        customerFeatures.push(customerFeature)
      }

      await handler(req, res)
      expect(res._getData()).toBe(
        JSON.stringify({
          data: customerFeatures.slice(0, 10).map((customerFeature) => ({
            created_at: customerFeature.created_at,
            feature_id: customerFeature.feature_id,
            id: customerFeature.id,
            stripe_customer_id: customerFeature.stripe_customer_id,
            value_flag: customerFeature.value_flag,
            value_limit: customerFeature.value_limit,
          })),
          has_more: true,
        }),
      )
    })

    test('Page parameters', async () => {
      const { account, token } = await createAccountWithToken()
      const { req, res } = createMocks({
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token.token}`,
        },
        query: {
          page: 2,
        },
      })

      const customerFeatures = []
      for (let i = 0; i < 11; i++) {
        const customerFeature = await createCustomerFeature(
          account.stripe_id,
          `Feature ${i}`,
          `feature_${i}`,
          false,
        )
        customerFeatures.push(customerFeature)
      }

      await handler(req, res)
      expect(res._getData()).toBe(
        JSON.stringify({
          data: customerFeatures.slice(10, 11).map((customerFeature) => ({
            created_at: customerFeature.created_at,
            feature_id: customerFeature.feature_id,
            id: customerFeature.id,
            stripe_customer_id: customerFeature.stripe_customer_id,
            value_flag: customerFeature.value_flag,
            value_limit: customerFeature.value_limit,
          })),
          has_more: false,
        }),
      )
    })
  })
})

describe('POST', () => {
  test('Creates a new feature', async () => {
    const { account, token } = await createAccountWithToken()
    const customer = await createStripeCustomer(account.stripe_id)
    const feature = await createFlagFeature(
      account.stripe_id,
      'Feature 1',
      'feature_1',
      false,
    )
    const { req, res } = createMocks({
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token.token}`,
      },
      body: {
        stripe_customer_id: customer.stripe_id,
        feature_id: feature.id,
        value_flag: true,
      },
    })
    await handler(req, res)
    expect(res._getStatusCode()).toBe(201)
    const data = JSON.parse(res._getData())
    expect(res._getData()).toBe(
      JSON.stringify({
        created_at: data.created_at,
        feature_id: feature.id,
        id: data.id,
        stripe_customer_id: customer.stripe_id,
        value_flag: true,
        value_limit: null,
      }),
    )
    expect(storeAccountStatesAsync).toHaveBeenCalledWith(account.stripe_id)
  })

  test('Validates field schema for flag', async () => {
    const { account, token } = await createAccountWithToken()
    const customer = await createStripeCustomer(account.stripe_id)
    const feature = await createFlagFeature(
      account.stripe_id,
      'Feature 1',
      'feature_1',
      false,
    )
    const { req, res } = createMocks({
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token.token}`,
      },
      body: {
        stripe_customer_id: customer.stripe_id,
        feature_id: feature.id,
      },
    })
    await handler(req, res)
    expect(res._getStatusCode()).toBe(400)
    expect(res._getData()).toBe(
      JSON.stringify({
        error: {
          formErrors: ['Invalid input'],
          fieldErrors: {},
        },
      }),
    )
  })

  test('Validates field schema for limit', async () => {
    const { account, token } = await createAccountWithToken()
    const customer = await createStripeCustomer(account.stripe_id)
    const feature = await createLimitFeature(
      account.stripe_id,
      'Feature 1',
      'feature_1',
      100,
    )
    const { req, res } = createMocks({
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token.token}`,
      },
      body: {
        stripe_customer_id: customer.stripe_id,
        feature_id: feature.id,
      },
    })
    await handler(req, res)
    expect(res._getStatusCode()).toBe(400)
    expect(res._getData()).toBe(
      JSON.stringify({
        error: {
          formErrors: ['Invalid input'],
          fieldErrors: {},
        },
      }),
    )
  })
})
