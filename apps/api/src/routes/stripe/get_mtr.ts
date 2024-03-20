import { HonoEnv } from '@/lib/hono/env'
import { Context } from 'hono'
export default async function (c: Context<HonoEnv>) {
  const { account_id } = await c.req.json()

  try {
    const mtr = await c.get('billingService').getMTR(account_id)
    return c.json(mtr)
  } catch (error: any) {
    return c.json({ error: error.message }, 400)
  }
}
