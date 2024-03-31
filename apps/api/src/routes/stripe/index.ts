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
import identify from './identify'
import syncAccount from './sync_account'
import track from './track'
import updateAccountFeature from './update_account_feature'
import updateCustomerFeatures from './update_customer_features'
import updatePricingTable from './update_pricing_table'
import updateProductFeatures from './update_product_features'

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

export function initRoutes(app: App, basePath: string) {
  app.use(
    `${basePath}/*`,
    auth([
      `${basePath}/billing_checkout`,
      `${basePath}/billing_checkout_success`,
      `${basePath}/billing_portal`,
      `${basePath}/billing_webhooks`,
      `${basePath}/checkout_redirect`,
      `${basePath}/connected_webhooks`,
    ]),
  )

  app.post(`${basePath}/acknowledge_setup`, acknowledgeSetup)
  app.get(`${basePath}/billing_checkout`, billingCheckout)
  app.get(`${basePath}/billing_checkout_success`, billingCheckoutSuccess)
  app.get(`${basePath}/billing_portal`, billingPortal)
  app.post(`${basePath}/billing_webhooks`, billingWebhooks)
  app.get(`${basePath}/checkout_redirect`, checkoutRedirect)
  app.post(`${basePath}/connected_webhooks`, connectedWebhooks)
  app.post(`${basePath}/create_account_feature`, createAccountFeature)
  app.post(`${basePath}/create_pricing_table`, createPricingTable)
  app.post(`${basePath}/delete_account_feature`, deleteAccountFeature)
  app.post(`${basePath}/delete_pricing_table`, deletePricingTable)
  app.post(`${basePath}/get_account`, getAccount)
  app.post(`${basePath}/get_account_state`, getAccountState)
  app.post(`${basePath}/get_account_features`, getAccountFeatures)
  app.post(`${basePath}/get_customer_features`, getCustomerFeatures)
  app.post(`${basePath}/get_customer_state`, getCustomerState)
  app.post(`${basePath}/get_entitlements`, getEntitlements)
  app.post(`${basePath}/get_mtr`, getMtr)
  app.post(`${basePath}/get_mtr_estimate`, getMtrEstimate)
  app.post(`${basePath}/get_pricing_tables`, getPricingTables)
  app.post(`${basePath}/get_pricing_table_products`, getPricingTableProducts)
  app.post(`${basePath}/get_pricing_table`, getPricingTable)
  app.post(`${basePath}/get_product_features`, getProductFeatures)
  app.post(`${basePath}/get_product_state`, getProductState)
  app.post(`${basePath}/get_publishable_token`, getPublishableToken)
  app.post(`${basePath}/get_subscriptions_state`, getSubscriptionsState)
  app.post(`${basePath}/get_token`, getToken)
  app.post(`${basePath}/identify`, identify)
  app.post(`${basePath}/sync_account`, syncAccount)
  app.post(`${basePath}/track`, track)
  app.post(`${basePath}/update_account_feature`, updateAccountFeature)
  app.post(`${basePath}/update_customer_features`, updateCustomerFeatures)
  app.post(`${basePath}/update_pricing_table`, updatePricingTable)
  app.post(`${basePath}/update_product_features`, updateProductFeatures)
}
