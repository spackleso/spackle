/**
 * @jest-environment node
 */

import app from '@/index'
import { MOCK_ENV, TestClient } from '@/lib/test/client'
import { beforeAll, afterAll, describe, test, expect } from 'vitest'

let client: TestClient
beforeAll(async () => {
  client = new TestClient(app)
})
afterAll(async () => {
  await client.teardown()
})

describe('POST', () => {
  test('Requires a signature', async () => {
    const res = await app.request(
      '/stripe/get_token',
      {
        method: 'POST',
        body: JSON.stringify({}),
      },
      MOCK_ENV,
    )

    expect(res.status).toBe(403)
    expect(await res.json()).toEqual({
      error: 'Unauthorized',
    })
  })

  test('Creates a new token if one does not exist', async () => {
    const account = await client.createTestStripeAccount()
    const res = await client.stripeRequest('/stripe/get_token', {
      method: 'POST',
      body: JSON.stringify({
        account_id: account.stripeId,
      }),
    })

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({
      token: expect.any(String),
    })
  })

  test('Returns an existing token if one exists', async () => {
    const account = await client.createTestStripeAccount()
    const token = await client.tokenService.createToken(account.stripeId)
    const res = await client.stripeRequest('/stripe/get_token', {
      method: 'POST',
      body: JSON.stringify({
        account_id: account.stripeId,
      }),
    })

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({
      token: token.token,
    })
  })
})
