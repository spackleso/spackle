/**
 * @jest-environment node
 */
import handler from '@/pages/api/stripe/billing_checkout_success'
import { genStripeId, testHandler } from '@/tests/helpers'
import db, { stripeAccounts } from 'spackle-db'

const stripeAccountId = genStripeId('acct')
const stripeCustomerId = genStripeId('cus')

jest.mock('@/store/dynamodb', () => {
  return {
    __esModule: true,
    storeCustomerState: jest.fn(() => Promise.resolve()),
  }
})

jest.mock('@/stripe', () => {
  return {
    __esModule: true,
    liveStripe: {
      checkout: {
        sessions: {
          retrieve: jest.fn(() => ({
            customer: stripeCustomerId,
          })),
        },
      },
    },
  }
})

jest.mock('@/stripe/sync', () => {
  return {
    __esModule: true,
    syncStripeCustomer: jest.fn(() => Promise.resolve()),
    syncStripeSubscriptions: jest.fn(() => Promise.resolve()),
  }
})

describe('GET', () => {
  test('Redirects to settings page on success', async () => {
    await db
      .insert(stripeAccounts)
      .values({
        stripeId: stripeAccountId,
      })
      .returning()

    process.env.STRIPE_APP_ID = 'so.spackle.stripe'
    process.env.STRIPE_ACCOUNT_ID = stripeAccountId
    const res = await testHandler(handler, {
      method: 'GET',
      body: {},
      params: {
        sessionId: genStripeId('cs'),
      },
    })

    expect(res._getStatusCode()).toBe(302)
    expect(res._getRedirectUrl()).toBe(
      'https://dashboard.stripe.com/settings/apps/so.spackle.stripe',
    )
  })
})
