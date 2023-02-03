import { createMocks } from 'node-mocks-http'
import handler from '@/pages/api/v1/features/index'
import { createAccountWithToken, createFlagFeature } from '@/tests/helpers'

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
    }),
  )
})

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
    }),
  )
})
