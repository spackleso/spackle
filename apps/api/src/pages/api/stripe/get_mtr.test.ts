/**
 * @jest-environment node
 */
import db, { stripeAccounts, stripeCustomers, stripePrices } from '@/db'
import handler from '@/pages/api/stripe/get_mtr'
import {
  createAccount,
  createsBillableCharge,
  createStripeProduct,
  createStripeSubscription,
  genStripeId,
  stripeTestHandler,
  testHandler,
} from '@/tests/helpers'
import { eq } from 'drizzle-orm'

async function getOrCreateSpackleAccount() {
  const stripeAccountId = process.env.STRIPE_ACCOUNT_ID ?? ''
  const accounts = await db
    .select()
    .from(stripeAccounts)
    .where(eq(stripeAccounts.stripeId, stripeAccountId))

  if (accounts.length) {
    return accounts[0]
  } else {
    const stripeAccount = (
      await db
        .insert(stripeAccounts)
        .values({
          stripeId: stripeAccountId,
          billingStripeCustomerId: genStripeId('cus'),
          stripeJson: {},
        })
        .returning()
    )[0]
    await db
      .insert(stripeCustomers)
      .values({
        stripeAccountId: stripeAccount.stripeId,
        stripeId: stripeAccount.billingStripeCustomerId!,
        stripeJson: {},
      })
      .returning()
    return stripeAccount
  }
}

async function getOrCreateSpackleSubscription(stripeCustomerId: string) {
  const billingAccount = await getOrCreateSpackleAccount()

  const stripePriceId = process.env.BILLING_ENTITLEMENTS_PRICE_ID ?? ''
  const prices = await db
    .select()
    .from(stripePrices)
    .where(eq(stripePrices.stripeId, stripePriceId))

  let price
  if (prices.length) {
    price = prices[0]
  } else {
    const product = await createStripeProduct(billingAccount.stripeId)
    price = (
      await db
        .insert(stripePrices)
        .values({
          stripeAccountId: billingAccount.stripeId,
          stripeId: stripePriceId,
          stripeJson: {},
          stripeProductId: product.stripeId,
        })
        .returning()
    )[0]
  }

  const fifteenDaysAgo = new Date(new Date().setDate(new Date().getDate() - 15))
  const fifteenDaysFromNow = new Date(
    new Date().setDate(new Date().getDate() + 15),
  )
  return await createStripeSubscription(
    billingAccount.stripeId,
    stripeCustomerId,
    price.stripeId,
    {
      current_period_start: fifteenDaysAgo.getTime() / 1000,
      current_period_end: fifteenDaysFromNow.getTime() / 1000,
      items: {
        data: [
          {
            id: genStripeId('si'),
            price: {
              id: price.stripeId,
              product: price.stripeProductId,
            },
          },
        ],
      },
    },
  )
}

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

  test('Returns 400 if subscriptions missing', async () => {
    const account = await createAccount()
    await db
      .update(stripeAccounts)
      .set({ billingStripeCustomerId: genStripeId('cus') })
      .where(eq(stripeAccounts.stripeId, account.stripeId))

    const res = await stripeTestHandler(handler, {
      body: {
        account_id: account.stripeId,
      },
    })
    expect(res._getStatusCode()).toBe(400)
    expect(res._getJSONData()).toStrictEqual({
      error: `Stripe account ${account.stripeId} has no active subscriptions`,
    })
  })

  test('Returns mtr based on current invoice interval', async () => {
    const billingAccount = await getOrCreateSpackleAccount()

    // Setup a new spackle account w/ an active subscription to Spackle
    let account = await createAccount()
    await db
      .insert(stripeCustomers)
      .values({
        stripeAccountId: billingAccount.stripeId,
        stripeId: account.billingStripeCustomerId!,
        stripeJson: {},
      })
      .returning()
    await getOrCreateSpackleSubscription(account.billingStripeCustomerId!)

    // Set up a new subscription on the account
    for (let i = 0; i < 10; i++) {
      await createsBillableCharge(
        account.stripeId,
        20000,
        new Date(),
        0,
        'succeeded',
      )
    }

    const res = await stripeTestHandler(handler, {
      body: {
        account_id: account.stripeId,
      },
    })
    expect(res._getJSONData()).toStrictEqual({
      freeTierDollars: 1000,
      grossUsageDollars: 2000,
      netUsageDollars: 1000,
      mtr: 1,
    })
  })
})
