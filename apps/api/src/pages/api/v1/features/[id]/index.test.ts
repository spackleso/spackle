import { createMocks } from 'node-mocks-http'
import handler from '@/pages/api/v1/features/[id]/index'
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
  test('Returns a feature via id', async () => {
    const { account, token } = await createAccountWithToken()

    const feature = await createFlagFeature(
      account.stripe_id,
      'Feature',
      'feature',
      false,
    )

    const { req, res } = createMocks({
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token.token}`,
      },
      query: {
        id: feature.id,
      },
    })

    await handler(req, res)
    expect(res._getData()).toBe(
      JSON.stringify({
        created_at: feature.created_at,
        id: feature.id,
        key: feature.key,
        name: feature.name,
        type: feature.type,
        value_flag: feature.value_flag,
        value_limit: feature.value_limit,
      }),
    )
  })

  test('Returns a feature via key', async () => {
    const { account, token } = await createAccountWithToken()

    const feature = await createFlagFeature(
      account.stripe_id,
      'Feature',
      'feature',
      false,
    )

    const { req, res } = createMocks({
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token.token}`,
      },
      query: {
        id: feature.key,
      },
    })

    await handler(req, res)
    expect(res._getData()).toBe(
      JSON.stringify({
        created_at: feature.created_at,
        id: feature.id,
        key: feature.key,
        name: feature.name,
        type: feature.type,
        value_flag: feature.value_flag,
        value_limit: feature.value_limit,
      }),
    )
  })

  test("Returns 404 if querying a different account's feature", async () => {
    const { token } = await createAccountWithToken()
    const { account: otherAccount } = await createAccountWithToken()

    const feature = await createFlagFeature(
      otherAccount.stripe_id,
      'Feature',
      'feature',
      false,
    )

    const { req, res } = createMocks({
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token.token}`,
      },
      query: {
        id: feature.key,
      },
    })

    await handler(req, res)
    expect(res._getStatusCode()).toBe(404)
    expect(res._getData()).toBe(
      JSON.stringify({
        error: 'Not found',
      }),
    )
  })
})
