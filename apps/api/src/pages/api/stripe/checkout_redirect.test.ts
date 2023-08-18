/**
 * @jest-environment node
 */
import handler from '@/pages/api/stripe/checkout_redirect'
import { createUser, genStripeId, testHandler } from '@/tests/helpers'
import db, { stripeAccounts } from 'spackle-db'
import { liveStripe as stripe } from '@/stripe'

describe('GET', () => {
  test('Redirects to a Stripe billing portal session', async () => {
    const account = (
      await db
        .insert(stripeAccounts)
        .values({
          stripeId: genStripeId('acct'),
          billingStripeCustomerId: genStripeId('cus'),
        })
        .returning()
    )[0]

    const user = await createUser(account.stripeId)

    const query = {
      user_id: user.stripeId,
      account_id: account.stripeId,
      email: 'test@test.com',
    }

    process.env.WEB_HOST = 'https://spackle.so'
    const sig = stripe.webhooks.generateTestHeaderString({
      payload: JSON.stringify({
        user_id: user.stripeId,
        account_id: account.stripeId,
      }),
      secret: process.env.STRIPE_SIGNING_SECRET ?? '',
    })
    const res = await testHandler(handler, {
      method: 'GET',
      query: {
        ...query,
        sig,
      },
    })
    expect(res._getStatusCode()).toBe(302)
    expect(res._getRedirectUrl()).toBe(
      `https://spackle.so/checkout?session=${btoa(
        JSON.stringify({ ...query, sig }),
      )}`,
    )
    expect(res._getHeaders()).toHaveProperty('set-cookie')
    expect(res._getHeaders()['set-cookie']).toHaveLength(4)
    expect(res._getHeaders()['set-cookie']![0]).toBe(
      `user_id=${user.stripeId}; Domain=.spackle.so; Path=/`,
    )
    expect(res._getHeaders()['set-cookie']![1]).toBe(
      `account_id=${account.stripeId}; Domain=.spackle.so; Path=/`,
    )
    expect(res._getHeaders()['set-cookie']![2]).toBe(
      'email=test%40test.com; Domain=.spackle.so; Path=/',
    )
    expect(res._getHeaders()['set-cookie']![3]).toBe(
      `sig=${encodeURIComponent(sig)}; Domain=.spackle.so; Path=/`,
    )
  })
})
