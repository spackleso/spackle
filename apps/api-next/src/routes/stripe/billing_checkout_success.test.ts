/**
 * @jest-environment node
 */

import app from '@/index'
import { MOCK_ENV, TestClient, genStripeId } from '@/lib/test/client'
import { beforeAll, afterAll, describe, test, expect, vi } from 'vitest'

let client: TestClient
beforeAll(async () => {
  client = new TestClient(app)
})
afterAll(async () => {
  await client.teardown()
})

vi.mock('@/lib/services/stripe', () => {
  const StripeService = vi.fn()
  StripeService.prototype.syncStripeCustomer = vi.fn()
  StripeService.prototype.syncStripeSubscriptions = vi.fn()
  return { StripeService }
})

vi.mock('stripe', () => {
  return {
    __esModule: true,
    default: class {
      checkout = {
        sessions: {
          retrieve: vi.fn(() => ({
            customer: genStripeId('cus'),
          })),
        },
      }
    },
  }
})

describe('GET', () => {
  test('Redirects to settings page on success', async () => {
    const billingStripeAccount = await client.createTestStripeAccount()

    const res = await app.request(
      `/stripe/billing_checkout_success?sessionId=${genStripeId('cs')}`,
      {
        method: 'GET',
      },
      {
        ...MOCK_ENV,
        STRIPE_ACCOUNT_ID: billingStripeAccount.stripeId,
        STRIPE_APP_ID: 'so.spackle.stripe',
      },
    )

    expect(res.status).toBe(302)
    expect(res.headers.get('Location')).toBe(
      'https://dashboard.stripe.com/settings/apps/so.spackle.stripe',
    )
  })
})
