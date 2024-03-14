import { Context, Next } from 'hono'
import { OpenAPIHono } from '@hono/zod-openapi'
import { HonoEnv } from '@/lib/hono/env'

import acknowledgeSetup from './acknowledge_setup'
import getAccount from './get_account'
import getAccountFeatures from './get_account_features'

const app = new OpenAPIHono<HonoEnv>()

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

// TODO enable auth for all routes when complete
app.use('/acknowledge_setup', auth())
app.post('/acknowledge_setup', acknowledgeSetup)

app.use('/get_account', auth())
app.post('/get_account', getAccount)

app.use('/get_account_features', auth())
app.post('/get_account_features', getAccountFeatures)

export default app
