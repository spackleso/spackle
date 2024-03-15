import { HonoEnv } from '@/lib/hono/env'
import { and, eq, schema } from '@spackle/db'
import { Context } from 'hono'

export default async function (c: Context<HonoEnv>) {
  const { account_id, mode, pricing_table_id } = await c.req.json()

  if (!pricing_table_id) {
    c.status(404)
    return c.json({})
  }

  const pricingTableResult = await c
    .get('db')
    .select({
      id: c.get('dbService').encodePk(schema.pricingTables.id),
      name: schema.pricingTables.name,
      mode: schema.pricingTables.mode,
      monthly_enabled: schema.pricingTables.monthlyEnabled,
      annual_enabled: schema.pricingTables.annualEnabled,
    })
    .from(schema.pricingTables)
    .where(
      and(
        eq(schema.pricingTables.stripeAccountId, account_id),
        eq(schema.pricingTables.mode, mode === 'live' ? 0 : 1),
        c.get('dbService').decodePk(schema.pricingTables.id, pricing_table_id),
      ),
    )

  if (pricingTableResult.length === 0) {
    c.status(404)
    return c.json({})
  } else {
    let pricingTable = pricingTableResult[0]
    return c.json(pricingTable)
  }
}
