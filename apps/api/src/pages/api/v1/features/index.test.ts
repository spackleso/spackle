/**
 * @jest-environment node
 */
import handler from '@/pages/api/v1/features/index'
import {
  createAccountWithPublishableToken,
  createAccountWithToken,
  createFlagFeature,
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

describe('GET', () => {
  test('Returns a list of features', async () => {
    const { account, token } = await createAccountWithToken()

    const features = []
    for (let i = 0; i < 5; i++) {
      const feature = await createFlagFeature(
        account.stripeId,
        `Feature ${i}`,
        `feature_${i}`,
        false,
      )
      features.push(feature)
    }

    const res = await testHandler(handler, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token.token}`,
      },
    })

    expect(res._getData()).toBe(
      JSON.stringify({
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
      }),
    )
  })

  describe('Pagination', () => {
    test('Returns a paginated list of features', async () => {
      const { account, token } = await createAccountWithToken()

      const features = []
      for (let i = 0; i < 11; i++) {
        const feature = await createFlagFeature(
          account.stripeId,
          `Feature ${i}`,
          `feature_${i}`,
          false,
        )
        features.push(feature)
      }

      const res = await testHandler(handler, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token.token}`,
        },
      })

      expect(res._getData()).toBe(
        JSON.stringify({
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
        }),
      )
    })

    test('Page parameters', async () => {
      const { account, token } = await createAccountWithToken()

      const features = []
      for (let i = 0; i < 11; i++) {
        const feature = await createFlagFeature(
          account.stripeId,
          `Feature ${i}`,
          `feature_${i}`,
          false,
        )
        features.push(feature)
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
        }),
      )
    })
  })
})

describe('POST', () => {
  test('Creates a new feature', async () => {
    const { account, token } = await createAccountWithToken()
    const res = await testHandler(handler, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token.token}`,
      },
      body: {
        name: 'Feature 1',
        key: 'feature_1',
        type: 0,
        value_flag: false,
        value_limit: null,
      },
    })
    expect(res._getStatusCode()).toBe(201)
    const data = JSON.parse(res._getData())
    expect(res._getData()).toBe(
      JSON.stringify({
        created_at: data.created_at,
        id: data.id,
        key: 'feature_1',
        name: 'Feature 1',
        type: 0,
        value_flag: false,
        value_limit: null,
      }),
    )
    expect(storeAccountStatesAsync).toHaveBeenCalledWith(account.stripeId)
  })

  test('Validates field schema for flag', async () => {
    const { token } = await createAccountWithToken()
    const res = await testHandler(handler, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token.token}`,
      },
      body: {
        type: 0,
      },
    })
    expect(res._getStatusCode()).toBe(400)
    expect(res._getData()).toBe(
      JSON.stringify({
        error: {
          formErrors: [],
          fieldErrors: {
            name: ['Required'],
            key: ['Required'],
            value_flag: ['Required'],
          },
        },
      }),
    )
  })

  test('Validates field schema for limit', async () => {
    const { token } = await createAccountWithToken()
    const res = await testHandler(handler, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token.token}`,
      },
      body: {
        type: 1,
      },
    })
    expect(res._getStatusCode()).toBe(400)
    expect(res._getData()).toBe(
      JSON.stringify({
        error: {
          formErrors: [],
          fieldErrors: {
            name: ['Required'],
            key: ['Required'],
            value_limit: ['Required'],
          },
        },
      }),
    )
  })
})
