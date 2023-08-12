/**
 * @jest-environment node
 */
import handler from '@/pages/api/v1/product_features/index'
import {
  createAccountWithToken,
  createFlagFeature,
  createLimitFeature,
  createProductFeature,
  createStripeProduct,
  testHandler,
} from '@/tests/helpers'
import { storeAccountStatesAsync } from '@/store/dynamodb'

jest.mock('@/store/dynamodb', () => {
  return {
    __esModule: true,
    storeAccountStatesAsync: jest.fn(() => Promise.resolve()),
  }
})

test('Requires an API token', async () => {
  const res = await testHandler(handler, {
    method: 'GET',
    body: {},
  })

  expect(res._getStatusCode()).toBe(403)
  expect(res._getData()).toBe(
    JSON.stringify({
      error: 'Unauthorized',
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

describe('GET', () => {
  test('Returns a list of product features', async () => {
    const { account, token } = await createAccountWithToken()

    const productFeatures = []
    for (let i = 0; i < 5; i++) {
      const productFeature = await createProductFeature(
        account.stripeId,
        false,
        {
          name: `Feature ${i}`,
          key: `feature_${i}`,
        },
      )
      productFeatures.push(productFeature)
    }

    const res = await testHandler(handler, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token.token}`,
      },
    })

    expect(res._getData()).toBe(
      JSON.stringify({
        data: productFeatures.map((productFeature) => ({
          created_at: productFeature.createdAt,
          feature_id: productFeature.featureId,
          id: productFeature.id,
          stripe_product_id: productFeature.stripeProductId,
          value_flag: productFeature.valueFlag,
          value_limit: productFeature.valueLimit,
        })),
        has_more: false,
      }),
    )
  })

  describe('Pagination', () => {
    test('Returns a paginated list of features', async () => {
      const { account, token } = await createAccountWithToken()

      const productFeatures = []
      for (let i = 0; i < 11; i++) {
        const productFeature = await createProductFeature(
          account.stripeId,
          false,
          {
            name: `Feature ${i}`,
            key: `feature_${i}`,
          },
        )
        productFeatures.push(productFeature)
      }

      const res = await testHandler(handler, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token.token}`,
        },
      })

      expect(res._getData()).toBe(
        JSON.stringify({
          data: productFeatures.slice(0, 10).map((productFeature) => ({
            created_at: productFeature.createdAt,
            feature_id: productFeature.featureId,
            id: productFeature.id,
            stripe_product_id: productFeature.stripeProductId,
            value_flag: productFeature.valueFlag,
            value_limit: productFeature.valueLimit,
          })),
          has_more: true,
        }),
      )
    })

    test('Page parameters', async () => {
      const { account, token } = await createAccountWithToken()

      const productFeatures = []
      for (let i = 0; i < 11; i++) {
        const productFeature = await createProductFeature(
          account.stripeId,
          false,
          {
            name: `Feature ${i}`,
            key: `feature_${i}`,
          },
        )
        productFeatures.push(productFeature)
      }

      const res = await testHandler(handler, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token.token}`,
        },
        query: {
          page: 2,
        },
      })

      expect(res._getData()).toBe(
        JSON.stringify({
          data: productFeatures.slice(10, 11).map((productFeature) => ({
            created_at: productFeature.createdAt,
            feature_id: productFeature.featureId,
            id: productFeature.id,
            stripe_product_id: productFeature.stripeProductId,
            value_flag: productFeature.valueFlag,
            value_limit: productFeature.valueLimit,
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
    const product = await createStripeProduct(account.stripeId)
    const feature = await createFlagFeature(
      account.stripeId,
      'Feature 1',
      'feature_1',
      false,
    )
    const res = await testHandler(handler, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token.token}`,
      },
      body: {
        stripe_product_id: product.stripeId,
        feature_id: feature.id,
        value_flag: true,
      },
    })
    expect(res._getStatusCode()).toBe(201)
    const data = JSON.parse(res._getData())
    expect(res._getData()).toBe(
      JSON.stringify({
        created_at: data.created_at,
        feature_id: feature.id,
        id: data.id,
        stripe_product_id: product.stripeId,
        value_flag: true,
        value_limit: null,
      }),
    )
    expect(storeAccountStatesAsync).toHaveBeenCalledWith(account.stripeId)
  })

  test('Validates field schema for flag', async () => {
    const { account, token } = await createAccountWithToken()
    const product = await createStripeProduct(account.stripeId)
    const feature = await createFlagFeature(
      account.stripeId,
      'Feature 1',
      'feature_1',
      false,
    )
    const res = await testHandler(handler, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token.token}`,
      },
      body: {
        stripe_product_id: product.stripeId,
        feature_id: feature.id,
      },
    })
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
    const product = await createStripeProduct(account.stripeId)
    const feature = await createLimitFeature(
      account.stripeId,
      'Feature 1',
      'feature_1',
      100,
    )
    const res = await testHandler(handler, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token.token}`,
      },
      body: {
        stripe_product_id: product.stripeId,
        feature_id: feature.id,
      },
    })
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
