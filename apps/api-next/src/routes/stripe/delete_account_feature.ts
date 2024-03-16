import { HonoEnv } from '@/lib/hono/env'
import { Context } from 'hono'
import { schema, and, eq } from '@spackle/db'

export default async function (c: Context<HonoEnv>) {
  const { account_id, feature_id } = await c.req.json()

  try {
    await c
      .get('db')
      .delete(schema.features)
      .where(
        and(
          eq(schema.features.stripeAccountId, account_id),
          eq(schema.features.id, feature_id),
        ),
      )
  } catch (error: any) {
    c.get('sentry').captureException(error)
    c.status(400)
    return c.json({
      error: (error as Error).message,
    })
  }

  c.status(200)
  return c.json({
    success: true,
  })
}
