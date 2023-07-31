/**
 * @jest-environment node
 */
import handler from '@/pages/api/v1/price_features/index'
import {
  createAccountWithToken,
  createFlagFeature,
  createLimitFeature,
  createPriceFeature,
  createStripePrice,
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
  test('Returns a list of price features', async () => {
    const { account, token } = await createAccountWithToken()
    const priceFeatures = []

    for (let i = 0; i < 5; i++) {
      const priceFeature = await createPriceFeature(
        account.stripeId,
        `Feature ${i}`,
        `feature_${i}`,
        false,
      )
      priceFeatures.push(priceFeature)
    }

    const res = await testHandler(handler, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token.token}`,
      },
    })

    expect(res._getData()).toBe(
      JSON.stringify({
        data: priceFeatures.map((priceFeature) => ({
          created_at: priceFeature.createdAt,
          feature_id: priceFeature.featureId,
          id: priceFeature.id,
          stripe_price_id: priceFeature.stripePriceId,
          value_flag: priceFeature.valueFlag,
          value_limit: priceFeature.valueLimit,
        })),
        has_more: false,
      }),
    )
  })

  describe('Pagination', () => {
    test('Returns a paginated list of features', async () => {
      const { account, token } = await createAccountWithToken()

      const priceFeatures = []
      for (let i = 0; i < 11; i++) {
        const priceFeature = await createPriceFeature(
          account.stripeId,
          `Feature ${i}`,
          `feature_${i}`,
          false,
        )
        priceFeatures.push(priceFeature)
      }

      const res = await testHandler(handler, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token.token}`,
        },
      })

      expect(res._getData()).toBe(
        JSON.stringify({
          data: priceFeatures.slice(0, 10).map((priceFeature) => ({
            created_at: priceFeature.createdAt,
            feature_id: priceFeature.featureId,
            id: priceFeature.id,
            stripe_price_id: priceFeature.stripePriceId,
            value_flag: priceFeature.valueFlag,
            value_limit: priceFeature.valueLimit,
          })),
          has_more: true,
        }),
      )
    })

    test('Page parameters', async () => {
      const { account, token } = await createAccountWithToken()

      const priceFeatures = []
      for (let i = 0; i < 11; i++) {
        const priceFeature = await createPriceFeature(
          account.stripeId,
          `Feature ${i}`,
          `feature_${i}`,
          false,
        )
        priceFeatures.push(priceFeature)
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
          data: priceFeatures.slice(10, 11).map((priceFeature) => ({
            created_at: priceFeature.createdAt,
            feature_id: priceFeature.featureId,
            id: priceFeature.id,
            stripe_price_id: priceFeature.stripePriceId,
            value_flag: priceFeature.valueFlag,
            value_limit: priceFeature.valueLimit,
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
    const price = await createStripePrice(account.stripeId, product.stripeId)
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
        stripe_price_id: price.stripeId,
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
        stripe_price_id: price.stripeId,
        value_flag: true,
        value_limit: null,
      }),
    )
    expect(storeAccountStatesAsync).toHaveBeenCalledWith(account.stripeId)
  })

  test('Validates field schema for flag', async () => {
    const { account, token } = await createAccountWithToken()
    const product = await createStripeProduct(account.stripeId)
    const price = await createStripePrice(account.stripeId, product.stripeId)
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
        stripe_price_id: price.stripeId,
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
    const price = await createStripePrice(account.stripeId, product.stripeId)
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
        stripe_price_id: price.stripeId,
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
