import { HonoEnv } from '@/lib/hono/env'
import { Context } from 'hono'

export default async function (c: Context<HonoEnv>) {
  const { account_id } = await c.req.json()

  try {
    const usage = await c.get('billingService').getUsage(account_id)
    return c.json(usage)
  } catch (error: any) {
    return c.json({ error: error.message }, 400)
  }
}
