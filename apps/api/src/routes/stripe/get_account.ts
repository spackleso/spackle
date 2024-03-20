import { Context } from 'hono'
import { HonoEnv } from '@/lib/hono/env'

export default async function (c: Context<HonoEnv>) {
  const { account_id, account_name, user_email, user_name, user_id } =
    await c.req.json()

  const account = await c
    .get('stripeService')
    .syncStripeAccount(account_id, account_name)

  if (user_id) {
    try {
      await c
        .get('stripeService')
        .syncStripeUser(account_id, user_id, user_email, user_name)
    } catch (error) {
      c.get('sentry').captureException(error)
      c.status(400)
      return c.json({ error })
    }
  }

  return c.json({
    has_acknowledged_setup: account.hasAcknowledgedSetup,
    id: account.id,
    initial_sync_complete: account.initialSyncComplete,
    initial_sync_started_at: account.initialSyncStartedAt,
    stripe_id: account.stripeId,
  })
}
