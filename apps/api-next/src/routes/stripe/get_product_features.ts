import { HonoEnv } from '@/lib/hono/env'
import { and, eq, schema } from '@spackle/db'
import { Context } from 'hono'

export default async function (c: Context<HonoEnv>) {
  const { account_id, product_id } = await c.req.json()
  const data = await c
    .get('db')
    .select({
      id: schema.productFeatures.id,
      feature_id: schema.productFeatures.featureId,
      value_flag: schema.productFeatures.valueFlag,
      value_limit: schema.productFeatures.valueLimit,
      name: schema.features.name,
    })
    .from(schema.productFeatures)
    .leftJoin(
      schema.features,
      eq(schema.productFeatures.featureId, schema.features.id),
    )
    .where(
      and(
        eq(schema.productFeatures.stripeAccountId, account_id),
        eq(schema.productFeatures.stripeProductId, product_id),
      ),
    )
    .orderBy(schema.features.name)

  return c.json({ data })
}
