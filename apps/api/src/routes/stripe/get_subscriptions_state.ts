import { HonoEnv } from '@/lib/hono/env'
import { Context } from 'hono'

export default async function (c: Context<HonoEnv>) {
  const { account_id, customer_id, mode } = await c.req.json()
  await c
    .get('stripeService')
    .getOrSyncStripeCustomer(account_id, customer_id, mode)
  const features = await c
    .get('entitlementsService')
    .getSubscriptionFeaturesState(account_id, customer_id)
  return c.json({
    data: features || [],
  })
}
