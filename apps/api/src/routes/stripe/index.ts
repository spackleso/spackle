import { Context, Next } from 'hono'
import { OpenAPIHono } from '@hono/zod-openapi'
import { App, HonoEnv } from '@/lib/hono/env'

import acknowledgeSetup from './acknowledge_setup'
import billingCheckout from './billing_checkout'
import billingCheckoutSuccess from './billing_checkout_success'
import billingPortal from './billing_portal'
import billingWebhooks from './billing_webhooks'
import checkoutRedirect from './checkout_redirect'
import connectedWebhooks from './connected_webhooks'
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
import getMtr from './get_mtr'
import getMtrEstimate from './get_mtr_estimate'
import getPricingTable from './get_pricing_table'
import getPricingTableProducts from './get_pricing_table_products'
import getPricingTables from './get_pricing_tables'
import getProductFeatures from './get_product_features'
import getProductState from './get_product_state'
import getPublishableToken from './get_publishable_token'
import getSubscriptionsState from './get_subscriptions_state'
import getToken from './get_token'
import getUsage from './get_usage'
import identify from './identify'
import syncAccount from './sync_account'
import track from './track'
import updateAccountFeature from './update_account_feature'
import updateCustomerFeatures from './update_customer_features'
import updatePricingTable from './update_pricing_table'
import updateProductFeatures from './update_product_features'

const app = new OpenAPIHono<HonoEnv>() as App

function auth(exemptPaths: string[] = []) {
  return async (c: Context, next: Next) => {
    if (!exemptPaths.includes(c.req.path)) {
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
    }
    await next()
  }
}

app.use(
  '*',
  auth([
    '/stripe/billing_checkout',
    '/stripe/billing_checkout_success',
    '/stripe/billing_portal',
    '/stripe/billing_webhooks',
    '/stripe/checkout_redirect',
    '/stripe/connected_webhooks',
  ]),
)

app.post('/acknowledge_setup', acknowledgeSetup)
app.get('/billing_checkout', billingCheckout)
app.get('/billing_checkout_success', billingCheckoutSuccess)
app.get('/billing_portal', billingPortal)
app.post('/billing_webhooks', billingWebhooks)
app.get('/checkout_redirect', checkoutRedirect)
app.post('/connected_webhooks', connectedWebhooks)
app.post('/create_account_feature', createAccountFeature)
app.post('/create_pricing_table', createPricingTable)
app.post('/delete_account_feature', deleteAccountFeature)
app.post('/delete_pricing_table', deletePricingTable)
app.post('/get_account', getAccount)
app.post('/get_account_state', getAccountState)
app.post('/get_account_features', getAccountFeatures)
app.post('/get_customer_features', getCustomerFeatures)
app.post('/get_customer_state', getCustomerState)
app.post('/get_entitlements', getEntitlements)
app.post('/get_mtr', getMtr)
app.post('/get_mtr_estimate', getMtrEstimate)
app.post('/get_pricing_tables', getPricingTables)
app.post('/get_pricing_table_products', getPricingTableProducts)
app.post('/get_pricing_table', getPricingTable)
app.post('/get_product_features', getProductFeatures)
app.post('/get_product_state', getProductState)
app.post('/get_publishable_token', getPublishableToken)
app.post('/get_subscriptions_state', getSubscriptionsState)
app.post('/get_token', getToken)
app.post('/get_usage', getUsage)
app.post('/identify', identify)
app.post('/sync_account', syncAccount)
app.post('/track', track)
app.post('/update_account_feature', updateAccountFeature)
app.post('/update_customer_features', updateCustomerFeatures)
app.post('/update_pricing_table', updatePricingTable)
app.post('/update_product_features', updateProductFeatures)

export default app
