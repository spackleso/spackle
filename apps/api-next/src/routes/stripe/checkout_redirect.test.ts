/**
 * @jest-environment node
 */

import app from '@/index'
import { MOCK_ENV, TestClient, genStripeId } from '@/lib/test/client'
import { schema } from '@spackle/db'
import { beforeAll, afterAll, describe, test, expect, vi } from 'vitest'
import stripe from 'stripe'

let client: TestClient
beforeAll(async () => {
  client = new TestClient(app)
})
afterAll(async () => {
  await client.teardown()
})

describe('GET', () => {
  test('Redirects to home page checkout page', async () => {
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
      email: 'test@test.com',
      sig: stripe.webhooks.generateTestHeaderString({
        payload: JSON.stringify({
          user_id: user.stripeId,
          account_id: account.stripeId,
        }),
        secret: client.env.STRIPE_SIGNING_SECRET,
      }),
    }

    const res = await app.request(
      `/stripe/checkout_redirect?${new URLSearchParams(query).toString()}`,
      {
        method: 'GET',
      },
      {
        ...MOCK_ENV,
        WEB_HOST: 'https://spackle.so',
      },
    )

    expect(res.status).toBe(302)
    expect(res.headers.get('location')).toBe(
      `https://spackle.so/checkout?session=${btoa(JSON.stringify(query))}`,
    )
    console.log(res.headers.get('set-cookie'))
    expect(res.headers.get('set-cookie')).toBe(
      `user_id=${user.stripeId}; Domain=.spackle.so; Path=/, account_id=${
        account.stripeId
      }; Domain=.spackle.so; Path=/, email=test%40test.com; Domain=.spackle.so; Path=/, sig=${encodeURIComponent(
        query.sig,
      )}; Domain=.spackle.so; Path=/`,
    )
  })
})
