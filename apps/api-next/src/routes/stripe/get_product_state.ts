import { HonoEnv } from '@/lib/hono/env'
import { Context } from 'hono'

export default async function (c: Context<HonoEnv>) {
  const { account_id, product_id } = await c.req.json()
  const features = await c
    .get('entitlementsService')
    .getProductFeaturesState(account_id, product_id)
  return c.json({ data: features })
}
