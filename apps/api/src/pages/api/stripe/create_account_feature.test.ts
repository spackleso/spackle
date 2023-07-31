/**
 * @jest-environment node
 */
import handler from '@/pages/api/stripe/create_account_feature'
import { createAccount, stripeTestHandler, testHandler } from '@/tests/helpers'
import { eq } from 'drizzle-orm'
import db, { features } from 'spackle-db'

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

  test('Creates a new feature', async () => {
    const account = await createAccount()
    const res = await stripeTestHandler(handler, {
      method: 'POST',
      body: {
        account_id: account.stripeId,
        name: 'Test',
        key: 'test',
        type: 0,
        value_flag: false,
        value_limit: null,
      },
    })

    expect(res._getStatusCode()).toBe(201)

    const result = await db
      .select()
      .from(features)
      .where(eq(features.stripeAccountId, account.stripeId))

    expect(result.length).toBe(1)
  })
})
