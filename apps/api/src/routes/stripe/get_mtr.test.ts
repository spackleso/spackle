/**
 * @jest-environment node
 */

import app from '@/index'
import { TestClient, genStripeId } from '@/lib/test/client'
import { schema, eq } from '@spackle/db'
import { beforeAll, afterAll, describe, test, expect } from 'vitest'

let client: TestClient
beforeAll(async () => {
  client = new TestClient(app)
})
afterAll(async () => {
  await client.teardown()
})

async function createSpackleSubscription(
  billingAccount: any,
  billingPrice: any,
  stripeCustomerId: string,
) {
  const fifteenDaysAgo = new Date(new Date().setDate(new Date().getDate() - 15))
  const fifteenDaysFromNow = new Date(
    new Date().setDate(new Date().getDate() + 15),
  )
  return await client.createTestStripeSubscription(
    billingAccount.stripeId,
    stripeCustomerId,
    billingPrice.stripeId,
    {
      current_period_start: fifteenDaysAgo.getTime() / 1000,
      current_period_end: fifteenDaysFromNow.getTime() / 1000,
      items: {
        data: [
          {
            id: genStripeId('si'),
            price: {
              id: billingPrice.stripeId,
              product: billingPrice.stripeProductId,
            },
          },
        ],
      },
    },
  )
}

describe('POST', () => {
  test('Requires a signature', async () => {
    const res = await client.request('/stripe/get_mtr', {
      method: 'POST',
      body: JSON.stringify({}),
    })

    expect(res.status).toBe(403)
    expect(await res.json()).toEqual({
      error: 'Unauthorized',
    })
  })

  test('Returns 400 if subscriptions missing', async () => {
    const account = await client.createTestStripeAccount()
    await client.db
      .update(schema.stripeAccounts)
      .set({ billingStripeCustomerId: genStripeId('cus') })
      .where(eq(schema.stripeAccounts.stripeId, account.stripeId))

    const res = await client.stripeRequest('/stripe/get_mtr', {
      method: 'POST',
      body: JSON.stringify({
        account_id: account.stripeId,
      }),
    })
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({
      error: `Stripe account ${account.stripeId} has no active subscriptions`,
    })
  })

  test('Returns mtr based on current invoice interval', async () => {
    const billingAccount = await client.createTestStripeAccount()
    const billingProduct = await client.createTestStripeProduct(
      billingAccount.stripeId,
    )
    const billingPrice = await client.createTestStripePrice(
      billingAccount.stripeId,
      billingProduct.stripeId,
    )

    // Setup a new spackle account w/ an active subscription to Spackle
    let account = await client.createTestStripeAccount()
    await client.db
      .insert(schema.stripeCustomers)
      .values({
        stripeAccountId: billingAccount.stripeId,
        stripeId: account.billingStripeCustomerId!,
        stripeJson: {},
      })
      .returning()

    await createSpackleSubscription(
      billingAccount,
      billingPrice,
      account.billingStripeCustomerId!,
    )

    // Set up a new subscription on the account
    for (let i = 0; i < 10; i++) {
      await client.createTestBillableCharge(
        account.stripeId,
        20000,
        new Date(),
        0,
        'succeeded',
      )
    }

    const res = await client.stripeRequest(
      '/stripe/get_mtr',
      {
        method: 'POST',
        body: JSON.stringify({
          account_id: account.stripeId,
        }),
      },
      {
        BILLING_STRIPE_ACCOUNT_ID: billingAccount.stripeId,
        BILLING_ENTITLEMENTS_PRICE_ID: billingPrice.stripeId,
      },
    )
    expect(await res.json()).toEqual({
      freeTierDollars: 1000,
      grossUsageDollars: 2000,
      netUsageDollars: 1000,
      mtr: 1,
    })
  })
})
