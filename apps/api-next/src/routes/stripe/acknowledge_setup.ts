import { HonoEnv } from '@/lib/hono/env'
import { schema } from '@spackle/db'
import { eq } from 'drizzle-orm'
import { Context } from 'hono'

export default async function (c: Context<HonoEnv>) {
  const { account_id } = await c.req.json()
  if (account_id) {
    await c
      .get('db')
      .update(schema.stripeAccounts)
      .set({
        hasAcknowledgedSetup: true,
      })
      .where(eq(schema.stripeAccounts.stripeId, account_id))
  }
  return c.json({ success: true })
}
