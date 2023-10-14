/**
 * @jest-environment node
 */
import handler from '@/pages/api/stripe/get_mtr_estimate'
import {
  createAccount,
  createsBillableCharge,
  createStripeCharge,
  createStripeInvoice,
  stripeTestHandler,
  testHandler,
} from '@/tests/helpers'

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

  test('Returns mtr based on last 30 days of usage', async () => {
    const account = await createAccount()
    const yesterday = new Date(new Date().setDate(new Date().getDate() - 1))
    await createsBillableCharge(
      account.stripeId,
      100,
      yesterday,
      0,
      'succeeded',
    )
    await createsBillableCharge(
      account.stripeId,
      100,
      yesterday,
      0,
      'succeeded',
    )
    await createsBillableCharge(
      account.stripeId,
      100,
      yesterday,
      0,
      'succeeded',
    )

    // Ignores failed
    await createsBillableCharge(account.stripeId, 500, yesterday, 0, 'failed')

    // Ignores outside date range
    const thirtyOneDaysAgo = new Date(
      new Date().setDate(new Date().getDate() - 31),
    )
    await createsBillableCharge(
      account.stripeId,
      600,
      thirtyOneDaysAgo,
      0,
      'succeeded',
    )

    // Ignores test mode
    await createsBillableCharge(
      account.stripeId,
      700,
      yesterday,
      1,
      'succeeded',
    )

    // Ignores charges without invoice
    await createStripeCharge(
      account.stripeId,
      {},
      'succeeded',
      800,
      yesterday,
      null,
      0,
    )

    // Ignores charges without subscription
    const invoice = await createStripeInvoice(account.stripeId, null, {})
    await createStripeCharge(
      account.stripeId,
      {},
      'succeeded',
      900,
      yesterday,
      invoice.stripeId,
      0,
    )

    const res = await stripeTestHandler(handler, {
      body: {
        account_id: account.stripeId,
      },
    })
    expect(res._getJSONData()).toStrictEqual({
      mtr: 3,
    })
  })
})
