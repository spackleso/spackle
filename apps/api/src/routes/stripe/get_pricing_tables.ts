import { HonoEnv } from '@/lib/hono/env'
import { and, asc, eq, schema } from '@spackle/db'
import { Context } from 'hono'

export default async function (c: Context<HonoEnv>) {
  const { account_id, mode } = await c.req.json()

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
      ),
    )
    .orderBy(asc(schema.pricingTables.id))

  let tables
  if (pricingTableResult.length === 0) {
    tables = await c
      .get('db')
      .insert(schema.pricingTables)
      .values({
        name: 'Default',
        stripeAccountId: account_id,
        mode: mode === 'live' ? 0 : 1,
      })
      .returning({
        id: schema.pricingTables.id,
        name: schema.pricingTables.name,
        mode: schema.pricingTables.mode,
        monthly_enabled: schema.pricingTables.monthlyEnabled,
        annual_enabled: schema.pricingTables.annualEnabled,
      })
  } else {
    tables = pricingTableResult
  }

  return c.json(tables)
}
