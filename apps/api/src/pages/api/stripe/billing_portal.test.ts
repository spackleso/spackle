/**
 * @jest-environment node
 */
import handler from '@/pages/api/stripe/billing_portal'
import { createUser, genStripeId, testHandler } from '@/tests/helpers'
import db, { stripeAccounts } from 'spackle-db'

jest.mock('@/stripe', () => {
  const original = jest.requireActual('@/stripe')
  return {
    __esModule: true,
    liveStripe: {
      ...original.liveStripe,
      billingPortal: {
        sessions: {
          create: jest.fn(() => ({
            url: 'https://billing.stripe.com/session/123',
          })),
        },
      },
    },
  }
})

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
    }
    const res = await testHandler(handler, {
      method: 'GET',
      query: {
        ...query,
        sig: stripe.webhooks.generateTestHeaderString({
          payload: JSON.stringify(query),
          secret: process.env.STRIPE_SIGNING_SECRET ?? '',
        }),
      },
    })
    expect(res._getStatusCode()).toBe(302)
    expect(res._getRedirectUrl()).toBe('https://billing.stripe.com/session/123')
  })
})
