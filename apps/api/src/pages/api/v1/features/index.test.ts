import { createMocks } from 'node-mocks-http'
import handler from '@/pages/api/v1/features/index'
import { createAccountWithToken, createFlagFeature } from '@/tests/helpers'
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
  test('Returns a list of features', async () => {
    const { account, token } = await createAccountWithToken()
    const { req, res } = createMocks({
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token.token}`,
      },
    })

    const features = []
    for (let i = 0; i < 5; i++) {
      const feature = await createFlagFeature(
        account.stripe_id,
        `Feature ${i}`,
        `feature_${i}`,
        false,
      )
      features.push(feature)
    }

    await handler(req, res)
    expect(res._getData()).toBe(
      JSON.stringify({
        data: features.map((feature) => ({
          created_at: feature.created_at,
          id: feature.id,
          key: feature.key,
          name: feature.name,
          type: feature.type,
          value_flag: feature.value_flag,
          value_limit: feature.value_limit,
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

      const features = []
      for (let i = 0; i < 11; i++) {
        const feature = await createFlagFeature(
          account.stripe_id,
          `Feature ${i}`,
          `feature_${i}`,
          false,
        )
        features.push(feature)
      }

      await handler(req, res)
      expect(res._getData()).toBe(
        JSON.stringify({
          data: features.slice(0, 10).map((feature) => ({
            created_at: feature.created_at,
            id: feature.id,
            key: feature.key,
            name: feature.name,
            type: feature.type,
            value_flag: feature.value_flag,
            value_limit: feature.value_limit,
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

      const features = []
      for (let i = 0; i < 11; i++) {
        const feature = await createFlagFeature(
          account.stripe_id,
          `Feature ${i}`,
          `feature_${i}`,
          false,
        )
        features.push(feature)
      }

      await handler(req, res)
      expect(res._getData()).toBe(
        JSON.stringify({
          data: features.slice(10, 11).map((feature) => ({
            created_at: feature.created_at,
            id: feature.id,
            key: feature.key,
            name: feature.name,
            type: feature.type,
            value_flag: feature.value_flag,
            value_limit: feature.value_limit,
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
    const { req, res } = createMocks({
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
    await handler(req, res)
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
    expect(storeAccountStatesAsync).toHaveBeenCalledWith(account.stripe_id)
  })

  test('Validates field schema for flag', async () => {
    const { token } = await createAccountWithToken()
    const { req, res } = createMocks({
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token.token}`,
      },
      body: {
        type: 0,
      },
    })
    await handler(req, res)
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
    const { req, res } = createMocks({
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token.token}`,
      },
      body: {
        type: 1,
      },
    })
    await handler(req, res)
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
