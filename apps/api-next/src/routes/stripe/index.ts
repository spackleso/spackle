import { Context, Next } from 'hono'
import { OpenAPIHono } from '@hono/zod-openapi'
import { HonoEnv } from '@/lib/hono/env'

import acknowledgeSetup from './acknowledge_setup'
import createAccountFeature from './create_account_feature'
import createPricingTable from './create_pricing_table'
import deleteAccountFeature from './delete_account_feature'
import deletePricingTable from './delete_pricing_table'
import getAccount from './get_account'
import getAccountFeatures from './get_account_features'
import getAccountState from './get_account_state'
import getCustomerFeatures from './get_customer_features'
import getCustomerState from './get_customer_state'
import getEntitlements from './get_entitlements'
import getPricingTable from './get_pricing_table'
import getPricingTableProducts from './get_pricing_table_products'
import getPricingTables from './get_pricing_tables'
import getProductFeatures from './get_product_features'
import getProductState from './get_product_state'
import getPublishableToken from './get_publishable_token'
import getSubscriptionsState from './get_subscriptions_state'
import getToken from './get_token'
import identify from './identify'
import track from './track'
import updateAccountFeature from './update_account_feature'
import updateCustomerFeatures from './update_customer_features'
import updatePricingTable from './update_pricing_table'
import updateProductFeatures from './update_product_features'

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

app.use('/delete_pricing_table', auth())
app.post('/delete_pricing_table', deletePricingTable)

app.use('/get_account', auth())
app.post('/get_account', getAccount)

app.use('/get_account_state', auth())
app.post('/get_account_state', getAccountState)

app.use('/get_account_features', auth())
app.post('/get_account_features', getAccountFeatures)

app.use('/get_customer_features', auth())
app.post('/get_customer_features', getCustomerFeatures)

app.use('/get_customer_state', auth())
app.post('/get_customer_state', getCustomerState)

app.use('/get_entitlements', auth())
app.post('/get_entitlements', getEntitlements)

app.use('/get_pricing_tables', auth())
app.post('/get_pricing_tables', getPricingTables)

app.use('/get_pricing_table_products', auth())
app.post('/get_pricing_table_products', getPricingTableProducts)

app.use('/get_pricing_table', auth())
app.post('/get_pricing_table', getPricingTable)

app.use('/get_product_features', auth())
app.post('/get_product_features', getProductFeatures)

app.use('/get_product_state', auth())
app.post('/get_product_state', getProductState)

app.use('/get_publishable_token', auth())
app.post('/get_publishable_token', getPublishableToken)

app.use('/get_subscriptions_state', auth())
app.post('/get_subscriptions_state', getSubscriptionsState)

app.use('/get_token', auth())
app.post('/get_token', getToken)

app.use('/identify', auth())
app.post('/identify', identify)

app.use('/track', auth())
app.post('/track', track)

app.use('/update_account_feature', auth())
app.post('/update_account_feature', updateAccountFeature)

app.use('/update_customer_features', auth())
app.post('/update_customer_features', updateCustomerFeatures)

app.use('/update_pricing_table', auth())
app.post('/update_pricing_table', updatePricingTable)

app.use('/update_product_features', auth())
app.post('/update_product_features', updateProductFeatures)

export default app
