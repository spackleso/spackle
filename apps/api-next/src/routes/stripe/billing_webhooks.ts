import { HonoEnv } from '@/lib/hono/env'
import { Context } from 'hono'
import Stripe from 'stripe'

export default async function handler(c: Context<HonoEnv>) {
  try {
    const sig = c.req.header('stripe-signature') as string
    const raw = await c.req.raw.clone().text()

    // Live webhook endpoints receive both live and test events.
    const event = c
      .get('liveStripe')
      .webhooks.constructEvent(raw, sig, c.env.STRIPE_BILLING_WEBHOOK_SECRET)

    c.get('sentry').setContext('stripeEvent', event)

    await c
      .get('stripeService')
      .handleWebhook(c.env.BILLING_STRIPE_ACCOUNT_ID, event)

    if (event.type === 'customer.subscription.created') {
      const account = await c
        .get('dbService')
        .getStripeAccountByBillingId(
          (event.data.object as Stripe.Subscription).customer as string,
        )

      if (account) {
        await c.get('telemetry').track('group_event', 'New subscription', {
          $groups: { company: account.stripeId },
        })
      }
    }
  } catch (error: any) {
    c.get('sentry').captureException(error)
    c.status(400)
    return c.json({ error: `Webhook Error: ${error.message}` })
  }
  return c.json({ success: true })
}
