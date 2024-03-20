import { HonoEnv } from '@/lib/hono/env'
import { Context } from 'hono'

export default async function (c: Context<HonoEnv>) {
  const sessionId = c.req.query('sessionId')

  const stripe =
    c.env.ENVIRONMENT === 'development'
      ? c.get('testStripe')
      : c.get('liveStripe')

  const settingsUrl =
    c.env.ENVIRONMENT === 'development'
      ? 'https://dashboard.stripe.com/test/apps/settings-preview'
      : `https://dashboard.stripe.com/settings/apps/${c.env.STRIPE_APP_ID}`

  const stripeAccountId = c.env.BILLING_STRIPE_ACCOUNT_ID || ''
  const session = await stripe.checkout.sessions.retrieve(sessionId as string)

  await c
    .get('stripeService')
    .syncStripeCustomer(
      stripeAccountId,
      session.customer as string,
      c.env.ENVIRONMENT === 'development' ? 'test' : 'live',
    )

  await c
    .get('stripeService')
    .syncStripeSubscriptions(
      stripeAccountId,
      session.customer as string,
      c.env.ENVIRONMENT === 'development' ? 'test' : 'live',
    )

  return c.redirect(settingsUrl)
}
