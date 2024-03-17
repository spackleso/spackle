import { HonoEnv } from '@/lib/hono/env'
import { Context } from 'hono'

export default async function handler(c: Context<HonoEnv>) {
  try {
    const sig = c.req.header('stripe-signature') as string
    const raw = await c.req.raw.clone().text()

    let event = c
      .get('liveStripe')
      .webhooks.constructEvent(raw, sig, c.env.STRIPE_CONNECTED_WEBHOOK_SECRET)

    c.get('sentry').setContext('stripeEvent', {
      id: event.id,
      account: event.account,
      type: event.type,
    })
    await c.get('stripeService').handleWebhook(event.account!, event)
  } catch (error: any) {
    c.get('sentry').captureException(error)
    c.status(400)
    return c.json({ error: `Webhook Error: ${error.message}` })
  }
  return c.json({ success: true })
}
