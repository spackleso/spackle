/**
 * @jest-environment node
 */

import app from '@/index'
import { MOCK_ENV, TestClient, genStripeId } from '@/lib/test/client'
import { schema, eq } from '@spackle/db'

let client: TestClient
beforeAll(async () => {
  client = new TestClient(app)
})
afterAll(async () => {
  await client.teardown()
})

describe('POST', () => {
  test('Requires a signature', async () => {
    const res = await app.request(
      '/stripe/get_entitlements',
      {
        method: 'POST',
        body: JSON.stringify({}),
      },
      MOCK_ENV,
    )

    expect(res.status).toBe(403)
    expect(await res.json()).toEqual({
      error: 'Unauthorized',
    })
  })

  test('Returns entitlements for the Spackle parent application', async () => {
    const billingAccount = await client.createTestStripeAccount()
    const account = await client.createTestStripeAccount()
    await client.db
      .update(schema.stripeAccounts)
      .set({
        billingStripeCustomerId: genStripeId('cus'),
      })
      .where(eq(schema.stripeAccounts.id, account.id))

    process.env.STRIPE_ACCOUNT_ID = account.stripeId

    const feature = await client.createTestFlagFeature(
      billingAccount.stripeId,
      'Entitlements',
      'entitlements',
      true,
    )

    const res = await client.stripeRequest(
      '/stripe/get_entitlements',
      {
        method: 'POST',
        body: JSON.stringify({
          account_id: account.stripeId,
        }),
      },
      {
        BILLING_STRIPE_ACCOUNT_ID: billingAccount.stripeId,
      },
    )

    expect(await res.json()).toEqual({
      version: 1,
      subscriptions: [],
      features: [
        {
          type: 0,
          id: feature.id,
          name: 'Entitlements',
          key: 'entitlements',
          value_flag: true,
          value_limit: null,
        },
      ],
    })
  })
})
