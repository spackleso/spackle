import { HonoEnv } from '@/lib/hono/env'
import { and, eq, schema } from '@spackle/db'
import { Context } from 'hono'

export default async function (c: Context<HonoEnv>) {
  const { account_id, customer_id, mode } = await c.req.json()

  await c
    .get('stripeService')
    .getOrSyncStripeCustomer(account_id, customer_id, mode)

  const data = await c
    .get('db')
    .select({
      id: schema.customerFeatures.id,
      feature_id: schema.customerFeatures.featureId,
      value_flag: schema.customerFeatures.valueFlag,
      value_limit: schema.customerFeatures.valueLimit,
      name: schema.features.name,
    })
    .from(schema.customerFeatures)
    .leftJoin(
      schema.features,
      eq(schema.customerFeatures.featureId, schema.features.id),
    )
    .where(
      and(
        eq(schema.customerFeatures.stripeAccountId, account_id),
        eq(schema.customerFeatures.stripeCustomerId, customer_id),
      ),
    )
    .orderBy(schema.features.name)

  return c.json({ data })
}
