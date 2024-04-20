import { HonoEnv } from '@/lib/hono/env'
import { eq, schema } from '@spackle/db'
import { Context } from 'hono'

export default async function handler(c: Context<HonoEnv>) {
  const isDev = c.env.ENVIRONMENT === 'development'
  const stripe = isDev ? c.get('testStripe') : c.get('liveStripe')
  const settingsUrl = isDev
    ? 'https://dashboard.stripe.com/test/apps/settings-preview'
    : `https://dashboard.stripe.com/settings/apps/${c.env.STRIPE_APP_ID}`

  const user_id = c.req.query('user_id')
  const account_id = c.req.query('account_id')

  let verified = false
  try {
    verified = await stripe.webhooks.signature.verifyHeaderAsync(
      JSON.stringify({
        user_id,
        account_id,
      }),
      c.req.query('sig') as string,
      c.env.STRIPE_SIGNING_SECRET,
    )
  } catch (error: any) {}

  if (!verified) {
    c.status(403)
    return c.json({
      error: 'Unauthorized',
    })
  }

  if (!account_id) {
    c.status(400)
    return c.json({ error: 'Account not found' })
  }

  const result = await c
    .get('db')
    .select()
    .from(schema.stripeAccounts)
    .where(eq(schema.stripeAccounts.stripeId, account_id as string))

  if (!result.length) {
    c.status(404)
    return c.json({ error: 'Account not found' })
  }

  const account = result[0]

  let stripeCustomerId = account.billingStripeCustomerId || undefined
  if (!stripeCustomerId) {
    c.status(400)
    return c.json({ error: 'Account not found' })
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: settingsUrl,
  })

  if (session.url) {
    return c.redirect(session.url)
  } else {
    c.status(400)
    return c.json({ error: 'Something went wrong' })
  }
}
