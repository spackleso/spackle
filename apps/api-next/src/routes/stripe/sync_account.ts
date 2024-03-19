import { HonoEnv } from '@/lib/hono/env'
import { Queue } from '@/lib/queue/queue'
import { Context } from 'hono'

export default async function (c: Context<HonoEnv>) {
  const { account_id } = await c.req.json()
  const q = new Queue(c.env.REDIS_URL, c.get('stripeService')).getQueue()
  await q.add('syncAllAccountData', { stripeAccountId: account_id })
  return c.json({})
}
