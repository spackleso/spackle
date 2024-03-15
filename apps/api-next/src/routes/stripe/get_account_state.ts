import { HonoEnv } from '@/lib/hono/env'
import { Context } from 'hono'

export default async function (c: Context<HonoEnv>) {
  const { account_id } = await c.req.json()

  const data = await c.get('entitlements').getAccountFeaturesState(account_id)

  return c.json({
    data,
  })
}
