import { HonoEnv } from '@/lib/hono/env'
import { Context } from 'hono'

export default async function (c: Context<HonoEnv>) {
  const { account_id, user_id, user_email, user_name, event, properties } =
    await c.req.json()

  const user = await c
    .get('dbService')
    .upsertStripeUser(account_id, user_id, user_email, user_name)

  if (!user) {
    c.status(400)
    return c.json({})
  }

  await c.get('telemetry').track(user.id.toString(), event, {
    ...properties,
    $groups: { company: account_id },
  })

  return c.json({})
}
