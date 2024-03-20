import { HonoEnv } from '@/lib/hono/env'
import { eq, schema } from '@spackle/db'
import { Context } from 'hono'

export default async function (c: Context<HonoEnv>) {
  const { account_id } = await c.req.json()
  const data = await c
    .get('db')
    .select({
      id: schema.features.id,
      name: schema.features.name,
      key: schema.features.key,
      type: schema.features.type,
      value_flag: schema.features.valueFlag,
      value_limit: schema.features.valueLimit,
    })
    .from(schema.features)
    .where(eq(schema.features.stripeAccountId, account_id))

  return c.json({ data: data })
}
