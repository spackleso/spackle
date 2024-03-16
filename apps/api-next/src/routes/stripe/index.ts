import { Context, Next } from 'hono'
import { OpenAPIHono } from '@hono/zod-openapi'
import { HonoEnv } from '@/lib/hono/env'

import acknowledgeSetup from './acknowledge_setup'
import createAccountFeature from './create_account_feature'
import createPricingTable from './create_pricing_table'
import deleteAccountFeature from './delete_account_feature'
import getAccount from './get_account'
import getAccountFeatures from './get_account_features'
import getAccountState from './get_account_state'
import getPricingTable from './get_pricing_table'
import getPricingTables from './get_pricing_tables'

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
      c.status(403)
      return c.json({ error: 'Unauthorized' })
    }
    return next()
  }
}

// TODO enable auth for all routes when complete
app.use('/acknowledge_setup', auth())
app.post('/acknowledge_setup', acknowledgeSetup)

app.use('/create_account_feature', auth())
app.post('/create_account_feature', createAccountFeature)

app.use('/create_pricing_table', auth())
app.post('/create_pricing_table', createPricingTable)

app.use('/delete_account_feature', auth())
app.post('/delete_account_feature', deleteAccountFeature)

app.use('/get_account', auth())
app.post('/get_account', getAccount)

app.use('/get_account_state', auth())
app.post('/get_account_state', getAccountState)

app.use('/get_account_features', auth())
app.post('/get_account_features', getAccountFeatures)

app.use('/get_pricing_tables', auth())
app.post('/get_pricing_tables', getPricingTables)

app.use('/get_pricing_table', auth())
app.post('/get_pricing_table', getPricingTable)

export default app
