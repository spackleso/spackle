import { CustomerState } from '@/lib/services/entitlements'
import { HonoEnv } from '@/lib/hono/env'
import { Context } from 'hono'

export default async function (c: Context<HonoEnv>) {
  const { account_id } = await c.req.json()
  const billingStripeAccountId = c.env.BILLING_STRIPE_ACCOUNT_ID

  const account = await c.get('dbService').getStripeAccount(account_id)
  if (!account) {
    c.status(404)
    return c.json({})
  }

  let entitlements: CustomerState = {
    version: 1,
    features: [],
    subscriptions: [],
  }

  if (account.billingStripeCustomerId) {
    entitlements = await c
      .get('entitlements')
      .getCustomerState(billingStripeAccountId, account.billingStripeCustomerId)
  }

  return c.json(entitlements)
}
