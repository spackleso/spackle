import { Context, Hono, Next } from 'hono'
import acknowledgeSetup from './acknowledge_setup'
import { Stripe } from 'stripe'

const app = new Hono()

function stripe() {
  return async (c: Context, next: Next) => {
    c.set(
      'liveStripe',
      new Stripe(c.env.STRIPE_LIVE_SECRET_KEY, {
        apiVersion: '2022-08-01' as any,
      }),
    )
    c.set(
      'testStripe',
      new Stripe(c.env.STRIPE_TEST_SECRET_KEY, {
        apiVersion: '2022-08-01' as any,
      }),
    )

    return next()
  }
}

function auth() {
  return async (c: Context, next: Next) => {
    const stripe = c.get('liveStripe')
    const sig = c.req.header('stripe-signature')
    const payload = await c.req.raw.clone().text()
    try {
      await stripe.webhooks.signature.verifyHeaderAsync(
        payload,
        sig,
        c.env.STRIPE_SIGNING_SECRET,
      )
    } catch (error: any) {
      console.error(error)
      c.status(403)
      return c.json({ error: 'Unauthorized' })
    }
    return next()
  }
}

app.use('*', stripe())

// TODO enable auth for all routes when complete
app.use('/acknowledge_setup', auth())
app.post('/acknowledge_setup', acknowledgeSetup)

export default app
