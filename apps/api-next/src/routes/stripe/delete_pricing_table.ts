import { HonoEnv } from '@/lib/hono/env'
import { and, eq, schema } from '@spackle/db'
import { Context } from 'hono'

export default async function (c: Context<HonoEnv>) {
  const { account_id, id } = await c.req.json()

  if (id) {
    try {
      await c
        .get('db')
        .delete(schema.pricingTables)
        .where(
          and(
            eq(schema.pricingTables.stripeAccountId, account_id),
            c.get('dbService').decodePk(schema.pricingTables.id, id),
          ),
        )
    } catch (error: any) {
      c.get('sentry').captureException(error)
      c.status(400)
      return c.json({
        error: (error as Error).message,
      })
    }
  }

  return c.json({
    success: true,
  })
}
