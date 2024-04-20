/**
 * @jest-environment node
 */

import app from '@/index'
import { TestClient, genStripeId } from '@/lib/test/client'
import { beforeAll, afterAll, describe, test, expect, vi } from 'vitest'
import { schema } from '@spackle/db'
import stripe from 'stripe'

let client: TestClient
beforeAll(async () => {
  client = new TestClient(app)
})
afterAll(async () => {
  await client.teardown()
})

vi.mock('stripe', () => {
  const Stripe = vi.fn() as any
  Stripe.prototype.billingPortal = {
    sessions: {
      create: vi.fn(() => ({
        url: 'https://billing.stripe.com/session/123',
      })),
    },
  }
  Stripe.webhooks = Stripe.prototype.webhooks = {
    generateTestHeaderString: vi.fn(() => 'test'),
    signature: {
      verifyHeaderAsync: vi.fn(() => Promise.resolve(true)),
    },
  }
  return {
    __esModule: true,
    default: Stripe,
  }
})

describe('GET', () => {
  test('Redirects to a Stripe billing portal session', async () => {
    const account = (
      await client.db
        .insert(schema.stripeAccounts)
        .values({
          stripeId: genStripeId('acct'),
          billingStripeCustomerId: genStripeId('cus'),
        })
        .returning()
    )[0]

    const user = await client.createTestStripeUser(account.stripeId)

    const query = {
      user_id: user.stripeId,
      account_id: account.stripeId,
      sig: stripe.webhooks.generateTestHeaderString({
        payload: JSON.stringify({
          user_id: user.stripeId,
          account_id: account.stripeId,
        }),
        secret: client.env.STRIPE_SIGNING_SECRET,
      }),
    }

    const res = await client.request(
      `/stripe/billing_portal?${new URLSearchParams(query).toString()}`,
      {
        method: 'GET',
      },
    )
    expect(res.status).toBe(302)
    expect(res.headers.get('location')).toBe(
      'https://billing.stripe.com/session/123',
    )
  })
})
