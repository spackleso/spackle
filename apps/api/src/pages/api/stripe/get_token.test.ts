/**
 * @jest-environment node
 */
import { createToken } from '@/api'
import handler from '@/pages/api/stripe/get_token'
import { createAccount, stripeTestHandler, testHandler } from '@/tests/helpers'

describe('POST', () => {
  test('Requires a signature', async () => {
    const res = await testHandler(handler, {
      method: 'POST',
      body: {},
    })

    expect(res._getStatusCode()).toBe(403)
    expect(res._getData()).toBe(
      JSON.stringify({
        error: 'Unauthorized',
      }),
    )
  })

  test('Creates a new token if one does not exist', async () => {
    const account = await createAccount()
    const res = await stripeTestHandler(handler, {
      method: 'POST',
      body: {
        account_id: account.stripeId,
      },
    })

    expect(res._getStatusCode()).toBe(200)
    expect(res._getJSONData()).toStrictEqual({
      token: expect.any(String),
    })
  })

  test('Returns an existing token if one exists', async () => {
    const account = await createAccount()
    const token = await createToken(account.stripeId)
    const res = await stripeTestHandler(handler, {
      method: 'POST',
      body: {
        account_id: account.stripeId,
      },
    })

    expect(res._getStatusCode()).toBe(200)
    expect(res._getJSONData()).toStrictEqual({
      token: token.token,
    })
  })
})
