import stripe from '.'
import { supabase } from '../supabase'

export const syncStripeAccount = async (id: string) => {
  const stripeAccount = await stripe.accounts.retrieve(id)

  return await supabase.from('stripe_accounts').upsert(
    {
      stripe_id: stripeAccount.id,
      stripe_json: JSON.stringify(stripeAccount),
    },
    { onConflict: 'stripe_id' },
  )
}

export const syncStripeProduct = async (account_id: string, id: string) => {
  const stripeProduct = await stripe.products.retrieve(id, {
    stripeAccount: account_id,
  })

  return await supabase.from('stripe_products').upsert(
    {
      stripe_id: stripeProduct.id,
      stripe_account_id: account_id,
      stripe_json: JSON.stringify(stripeProduct),
    },
    { onConflict: 'stripe_id' },
  )
}

export const syncStripePrice = async (account_id: string, id: string) => {
  const stripePrice = await stripe.prices.retrieve(id, {
    stripeAccount: account_id,
  })

  return await supabase.from('stripe_prices').upsert(
    {
      stripe_id: stripePrice.id,
      stripe_account_id: account_id,
      stripe_json: JSON.stringify(stripePrice),
      stripe_product_id: stripePrice.product,
    },
    { onConflict: 'stripe_id' },
  )
}

export const syncStripeCustomer = async (account_id: string, id: string) => {
  const stripeCustomer = await stripe.customers.retrieve(id, {
    stripeAccount: account_id,
  })

  return await supabase.from('stripe_customers').upsert(
    {
      stripe_id: stripeCustomer.id,
      stripe_account_id: account_id,
      stripe_json: JSON.stringify(stripeCustomer),
    },
    { onConflict: 'stripe_id' },
  )
}

export const syncStripeSubscriptions = async (
  account_id: string,
  customer_id: string,
) => {
  for await (const subscription of stripe.subscriptions.list({
    customer: customer_id,
  })) {
    await supabase.from('stripe_subscriptions').upsert(
      {
        stripe_id: subscription.id,
        stripe_account_id: account_id,
        stripe_customer_id: subscription.customer,
        stripe_json: JSON.stringify(subscription),
        status: subscription.status,
      },
      { onConflict: 'stripe_id' },
    )

    syncStripeSubscriptionItems(account_id, subscription.id)
  }
}

export const syncStripeSubscriptionItems = async (
  account_id: string,
  subscription_id: string,
) => {
  for await (const subscriptionItem of stripe.subscriptionItems.list({
    subscription: subscription_id,
  })) {
    await supabase.from('stripe_subscription_items').upsert(
      {
        stripe_id: subscriptionItem.id,
        stripe_account_id: account_id,
        stripe_json: JSON.stringify(subscriptionItem),
        stripe_price_id: subscriptionItem.price.id,
        stripe_subscription_id: subscriptionItem.subscription,
      },
      { onConflict: 'stripe_id' },
    )
  }
}
