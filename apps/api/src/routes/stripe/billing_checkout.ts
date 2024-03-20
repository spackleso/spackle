import { HonoEnv } from '@/lib/hono/env'
import { eq, schema } from '@spackle/db'
import { Context } from 'hono'

export default async function (c: Context<HonoEnv>) {
  const isDev = c.env.ENVIRONMENT === 'development'
  const stripe = isDev ? c.get('testStripe') : c.get('liveStripe')
  const settingsUrl = isDev
    ? 'https://dashboard.stripe.com/test/apps/settings-preview'
    : `https://dashboard.stripe.com/settings/apps/${c.env.STRIPE_APP_ID}`
  const host = c.env.HOST
  const stripePriceId = c.env.BILLING_ENTITLEMENTS_PRICE_ID

  const user_id = c.req.query('user_id')
  const account_id = c.req.query('account_id')
  const product = c.req.query('product')
  const email = c.req.query('email')

  if (!user_id || !account_id || !product) {
    c.status(400)
    return c.json({ error: 'Missing required parameters' })
  }

  try {
    stripe.webhooks.signature.verifyHeader(
      JSON.stringify({
        user_id,
        account_id,
      }),
      c.req.query('sig') as string,
      c.env.STRIPE_SIGNING_SECRET,
    )
  } catch (error: any) {
    console.error(error)
    c.status(403)
    return c.json({ error: 'Unauthorized' })
  }

  const result = await c
    .get('db')
    .select()
    .from(schema.stripeAccounts)
    .where(eq(schema.stripeAccounts.stripeId, account_id))
    .limit(1)

  const account = result[0]
  let stripeCustomerId = account.billingStripeCustomerId || undefined
  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({ email })
    const result = await c
      .get('db')
      .update(schema.stripeAccounts)
      .set({
        billingStripeCustomerId: customer.id,
      })
      .where(eq(schema.stripeAccounts.stripeId, account.stripeId))
      .returning()
    stripeCustomerId = result[0].billingStripeCustomerId || undefined
  }

  let session
  try {
    session = await stripe.checkout.sessions.create({
      line_items: [{ price: stripePriceId }],
      mode: 'subscription',
      success_url: `${host}/stripe/billing_checkout_success?sessionId={CHECKOUT_SESSION_ID}`,
      cancel_url: settingsUrl,
      customer: stripeCustomerId,
      allow_promotion_codes: true,
    })
  } catch (error: any) {
    c.status(400)
    return c.json({ error })
  }

  if (session.url) {
    return c.redirect(session.url)
  } else {
    c.status(400)
    return c.json({ error: 'Something went wrong' })
  }
}
