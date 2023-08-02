/**
 * @jest-environment node
 */
import handler from '@/pages/api/stripe/get_entitlements'
import {
  createAccount,
  createFlagFeature,
  genStripeId,
  stripeTestHandler,
  testHandler,
} from '@/tests/helpers'
import { eq } from 'drizzle-orm'
import db, { stripeAccounts } from 'spackle-db'

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

  test('Returns entitlements for the Spackle parent application', async () => {
    const account = await createAccount()
    await db
      .update(stripeAccounts)
      .set({
        billingStripeCustomerId: genStripeId('cus'),
      })
      .where(eq(stripeAccounts.id, account.id))

    process.env.STRIPE_ACCOUNT_ID = account.stripeId

    const feature = await createFlagFeature(
      account.stripeId,
      'Entitlements',
      'entitlements',
      true,
    )

    const res = await stripeTestHandler(handler, {
      body: {
        account_id: account.stripeId,
      },
    })

    expect(res._getJSONData()).toStrictEqual({
      version: 1,
      subscriptions: [],
      features: [
        {
          type: 0,
          id: feature.id,
          name: 'Entitlements',
          key: 'entitlements',
          value_flag: true,
          value_limit: null,
        },
      ],
    })
  })
})
