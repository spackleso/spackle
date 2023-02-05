import { createMocks } from 'node-mocks-http'
import handler from '@/pages/api/v1/product_features/index'
import {
  createAccountWithToken,
  createFlagFeature,
  createLimitFeature,
  createProductFeature,
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
  test('Returns a list of product features', async () => {
    const { account, token } = await createAccountWithToken()
    const { req, res } = createMocks({
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token.token}`,
      },
    })

    const productFeatures = []
    for (let i = 0; i < 5; i++) {
      const productFeature = await createProductFeature(
        account.stripe_id,
        `Feature ${i}`,
        `feature_${i}`,
        false,
      )
      productFeatures.push(productFeature)
    }

    await handler(req, res)
    expect(res._getData()).toBe(
      JSON.stringify({
        data: productFeatures.map((productFeature) => ({
          created_at: productFeature.created_at,
          feature_id: productFeature.feature_id,
          id: productFeature.id,
          stripe_product_id: productFeature.stripe_product_id,
          value_flag: productFeature.value_flag,
          value_limit: productFeature.value_limit,
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

      const productFeatures = []
      for (let i = 0; i < 11; i++) {
        const productFeature = await createProductFeature(
          account.stripe_id,
          `Feature ${i}`,
          `feature_${i}`,
          false,
        )
        productFeatures.push(productFeature)
      }

      await handler(req, res)
      expect(res._getData()).toBe(
        JSON.stringify({
          data: productFeatures.slice(0, 10).map((productFeature) => ({
            created_at: productFeature.created_at,
            feature_id: productFeature.feature_id,
            id: productFeature.id,
            stripe_product_id: productFeature.stripe_product_id,
            value_flag: productFeature.value_flag,
            value_limit: productFeature.value_limit,
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

      const productFeatures = []
      for (let i = 0; i < 11; i++) {
        const productFeature = await createProductFeature(
          account.stripe_id,
          `Feature ${i}`,
          `feature_${i}`,
          false,
        )
        productFeatures.push(productFeature)
      }

      await handler(req, res)
      expect(res._getData()).toBe(
        JSON.stringify({
          data: productFeatures.slice(10, 11).map((productFeature) => ({
            created_at: productFeature.created_at,
            feature_id: productFeature.feature_id,
            id: productFeature.id,
            stripe_product_id: productFeature.stripe_product_id,
            value_flag: productFeature.value_flag,
            value_limit: productFeature.value_limit,
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
    const product = await createStripeProduct(account.stripe_id)
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
        stripe_product_id: product.stripe_id,
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
        stripe_product_id: product.stripe_id,
        value_flag: true,
        value_limit: null,
      }),
    )
    expect(storeAccountStatesAsync).toHaveBeenCalledWith(account.stripe_id)
  })

  test('Validates field schema for flag', async () => {
    const { account, token } = await createAccountWithToken()
    const product = await createStripeProduct(account.stripe_id)
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
        stripe_product_id: product.stripe_id,
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
    const product = await createStripeProduct(account.stripe_id)
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
        stripe_product_id: product.stripe_id,
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
