import { HonoEnv } from '@/lib/hono/env'
import { and, eq, schema } from '@spackle/db'
import { Context } from 'hono'

export default async function (c: Context<HonoEnv>) {
  const { account_id, id, name, value_flag, value_limit } = await c.req.json()
  try {
    await c
      .get('db')
      .update(schema.features)
      .set({
        name,
        valueFlag: value_flag,
        valueLimit: value_limit,
      })
      .where(
        and(
          eq(schema.features.stripeAccountId, account_id),
          eq(schema.features.id, id),
        ),
      )
  } catch (error) {
    c.get('sentry').captureException(error)
    c.status(400)
    return c.json({
      error: (error as Error).message,
    })
  }

  return c.json({
    success: true,
  })
}
