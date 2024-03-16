import { HonoEnv } from '@/lib/hono/env'
import { Context } from 'hono'

export default async function (c: Context<HonoEnv>) {
  const { account_id, customer_id } = await c.req.json()
  const features = await c
    .get('entitlementsService')
    .getCustomerState(account_id, customer_id)
  return c.json({ data: features })
}
