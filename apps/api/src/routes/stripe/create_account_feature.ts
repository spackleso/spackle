import { HonoEnv } from '@/lib/hono/env'
import { schema } from '@spackle/db'
import { Context } from 'hono'

export default async function (c: Context<HonoEnv>) {
  const {
    account_id,
    name,
    key,
    type,
    value_flag,
    value_limit,
    user_id,
    user_email,
    user_name,
  } = await c.req.json()

  try {
    const values = {
      stripeAccountId: account_id,
      name,
      key,
      type,
      valueFlag: value_flag,
      valueLimit: value_limit,
    }
    await c.get('db').insert(schema.features).values(values)
  } catch (error) {
    c.get('sentry').captureException(error)
    c.status(400)
    return c.json({
      error: (error as Error).message,
    })
  }

  if (user_id) {
    const user = await c
      .get('dbService')
      .upsertStripeUser(account_id, user_id, user_email, user_name)

    if (user) {
      await c.get('telemetry').track(
        'Created feature',
        {
          $groups: { company: account_id },
        },
        user.id.toString(),
      )
    }
  }

  c.status(201)
  return c.json({
    success: true,
  })
}
