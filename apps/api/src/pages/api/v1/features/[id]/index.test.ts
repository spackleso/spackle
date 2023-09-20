/**
 * @jest-environment node
 */
import handler from '@/pages/api/v1/features/[id]/index'
import {
  createAccountWithPublishableToken,
  createAccountWithToken,
  createFlagFeature,
  testHandler,
} from '@/tests/helpers'

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
  test('Returns a feature via id', async () => {
    const { account, token } = await createAccountWithToken()

    const feature = await createFlagFeature(
      account.stripeId,
      'Feature',
      'feature',
      false,
    )

    const res = await testHandler(handler, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token.token}`,
      },
      query: {
        id: feature.id,
      },
    })

    expect(res._getData()).toBe(
      JSON.stringify({
        created_at: feature.createdAt,
        id: feature.id,
        key: feature.key,
        name: feature.name,
        type: feature.type,
        value_flag: feature.valueFlag,
        value_limit: feature.valueLimit,
      }),
    )
  })

  test('Returns a feature via key', async () => {
    const { account, token } = await createAccountWithToken()

    const feature = await createFlagFeature(
      account.stripeId,
      'Feature',
      'feature',
      false,
    )

    const res = await testHandler(handler, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token.token}`,
      },
      query: {
        id: feature.key,
      },
    })

    expect(res._getData()).toBe(
      JSON.stringify({
        created_at: feature.createdAt,
        id: feature.id,
        key: feature.key,
        name: feature.name,
        type: feature.type,
        value_flag: feature.valueFlag,
        value_limit: feature.valueLimit,
      }),
    )
  })

  test("Returns 404 if querying a different account's feature", async () => {
    const { token } = await createAccountWithToken()
    const { account: otherAccount } = await createAccountWithToken()

    const feature = await createFlagFeature(
      otherAccount.stripeId,
      'Feature',
      'feature',
      false,
    )

    const res = await testHandler(handler, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token.token}`,
      },
      query: {
        id: feature.key,
      },
    })

    expect(res._getStatusCode()).toBe(404)
    expect(res._getData()).toBe(
      JSON.stringify({
        error: 'Not found',
      }),
    )
  })
})
