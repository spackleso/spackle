import { HonoEnv } from '@/lib/hono/env'
import { Context } from 'hono'

export default async function (c: Context<HonoEnv>) {
  const { account_id } = await c.req.json()
  await c.env.SYNC.send({
    type: 'syncAllAccountData',
    payload: {
      stripeAccountId: account_id,
    },
  })
  return c.json({})
}
