/**
 * @jest-environment node
 */

import app from '@/index'
import { TestClient } from '@/lib/test/client'
import { beforeAll, afterAll, describe, test, expect, vi } from 'vitest'
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
  Stripe.prototype.checkout = {
    sessions: {
      create: vi.fn(() => ({
        url: 'https://billing.stripe.com/session/123',
      })),
    },
  }
  Stripe.webhooks = Stripe.prototype.webhooks = {
    generateTestHeaderString: vi.fn(() => 'test'),
    signature: {
      verifyHeader: vi.fn(() => true),
    },
  }
  return {
    __esModule: true,
    default: Stripe,
  }
})

describe('GET', () => {
  test('Redirects to a Stripe billing checkout session', async () => {
    const account = await client.createTestStripeAccount()
    const user = await client.createTestStripeUser(account.stripeId)
    const query = {
      user_id: user.stripeId,
      email: 'test@test.com',
      account_id: account.stripeId,
      product: 'entitlements',
      sig: stripe.webhooks.generateTestHeaderString({
        payload: JSON.stringify({
          user_id: user.stripeId,
          account_id: account.stripeId,
        }),
        secret: client.env.STRIPE_SIGNING_SECRET,
      }),
    }
    const res = await client.request(
      `/stripe/billing_checkout?${new URLSearchParams(query).toString()}`,
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
