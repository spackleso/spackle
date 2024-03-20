import { HonoEnv } from '@/lib/hono/env'
import { Context } from 'hono'

export default async function (c: Context<HonoEnv>) {
  const { account_id, account_name, user_id, user_email, user_name, path } =
    await c.req.json()

  const user = await c
    .get('dbService')
    .upsertStripeUser(account_id, user_id, user_email, user_name)

  if (!user) {
    c.status(400)
    return c.json({})
  }

  await c.get('telemetry').identify(
    user.id.toString(),
    {
      name: user.name,
      email: user.email,
      stripe_id: user.stripeId,
    },
    path,
  )

  await c
    .get('telemetry')
    .groupIdentify(user.id.toString(), account_id, account_name)

  return c.json({})
}
