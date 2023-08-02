/**
 * @jest-environment node
 */
import handler from '@/pages/api/stripe/acknowledge_setup'
import { liveStripe as stripe } from '@/stripe'
import { createAccount, stripeTestHandler, testHandler } from '@/tests/helpers'
import { getStripeAccount } from '@/stripe/db'

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

  test("Silent update if account doesn't exist", async () => {
    const res = await stripeTestHandler(handler, {
      method: 'POST',
      body: {
        account_id: 'acct_123',
      },
    })

    expect(res._getStatusCode()).toBe(200)
    expect(res._getData()).toBe(
      JSON.stringify({
        success: true,
      }),
    )
  })

  test('Acknowledges account setup', async () => {
    const account = await createAccount()
    expect(account.hasAcknowledgedSetup).toBe(false)
    const body = {
      account_id: account.stripeId,
    }
    const res = await testHandler(handler, {
      method: 'POST',
      headers: {
        'Stripe-Signature': stripe.webhooks.generateTestHeaderString({
          payload: JSON.stringify(body),
          secret: process.env.STRIPE_SIGNING_SECRET ?? '',
        }),
      },
      body,
    })

    expect(res._getStatusCode()).toBe(200)
    expect(res._getData()).toBe(
      JSON.stringify({
        success: true,
      }),
    )

    const updatedAccount = await getStripeAccount(account.stripeId)
    expect(updatedAccount!.hasAcknowledgedSetup).toBe(true)
  })
})
