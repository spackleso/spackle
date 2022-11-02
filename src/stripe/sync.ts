import { liveStripe, testStripe } from '.'
import { logger } from '../logger'
import { supabase } from '../supabase'
import * as Sentry from '@sentry/node'
import {
  invalidateAccountCustomerStates,
  invalidateCustomerState,
} from '@/cache'
import Stripe from 'stripe'

type Mode = 'test' | 'live'

export const syncStripeAccount = async (id: string) => {
  console.log(`Syncing account ${id}`)
  let stripeAccount: Stripe.Account
  try {
    stripeAccount = await liveStripe.accounts.retrieve(id)
  } catch (e: any) {
    if (e.message.includes('testmode')) {
      stripeAccount = await testStripe.accounts.retrieve(id)
    } else {
      throw e
    }
  }
  console.log(`Found account`, stripeAccount)

  return await supabase.from('stripe_accounts').upsert(
    {
      stripe_id: stripeAccount.id,
      stripe_json: JSON.stringify(stripeAccount),
    },
    { onConflict: 'stripe_id' },
  )
}

export const syncStripeProduct = async (
  account_id: string,
  id: string,
  mode: Mode,
) => {
  const stripe = mode === 'live' ? liveStripe : testStripe
  const stripeProduct = await stripe.products.retrieve(id, {
    stripeAccount: account_id,
  })

  const response = await supabase.from('stripe_products').upsert(
    {
      stripe_id: stripeProduct.id,
      stripe_account_id: account_id,
      stripe_json: JSON.stringify(stripeProduct),
    },
    { onConflict: 'stripe_id' },
  )

  if (!response.error) {
    await invalidateAccountCustomerStates(account_id)
  }

  return response
}

export const syncStripePrice = async (
  account_id: string,
  id: string,
  mode: Mode,
) => {
  const stripe = mode === 'live' ? liveStripe : testStripe
  const stripePrice = await stripe.prices.retrieve(id, {
    stripeAccount: account_id,
  })

  const response = await supabase.from('stripe_prices').upsert(
    {
      stripe_id: stripePrice.id,
      stripe_account_id: account_id,
      stripe_json: JSON.stringify(stripePrice),
      stripe_product_id: stripePrice.product,
    },
    { onConflict: 'stripe_id' },
  )

  if (!response.error) {
    await invalidateAccountCustomerStates(account_id)
  }

  return response
}

export const syncStripeCustomer = async (
  account_id: string,
  id: string,
  mode: Mode,
) => {
  const stripe = mode === 'live' ? liveStripe : testStripe
  const stripeCustomer = await stripe.customers.retrieve(id, {
    stripeAccount: account_id,
  })

  const response = await supabase.from('stripe_customers').upsert(
    {
      stripe_id: stripeCustomer.id,
      stripe_account_id: account_id,
      stripe_json: JSON.stringify(stripeCustomer),
    },
    { onConflict: 'stripe_id' },
  )

  if (!response.error) {
    await invalidateCustomerState(account_id, id)
  }

  return response
}

export const syncStripeSubscriptions = async (
  account_id: string,
  customer_id: string,
  mode: Mode,
) => {
  const stripe = mode === 'live' ? liveStripe : testStripe
  for await (const subscription of stripe.subscriptions.list(
    {
      customer: customer_id,
    },
    {
      stripeAccount: account_id,
    },
  )) {
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

    await syncStripeSubscriptionItems(account_id, subscription.id, mode)
  }

  await invalidateCustomerState(account_id, customer_id)
}

export const syncStripeSubscriptionItems = async (
  account_id: string,
  subscription_id: string,
  mode: Mode,
) => {
  const stripe = mode === 'live' ? liveStripe : testStripe
  for await (const subscriptionItem of stripe.subscriptionItems.list(
    {
      subscription: subscription_id,
    },
    {
      stripeAccount: account_id,
    },
  )) {
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

export const syncAllAccountData = async (account_id: string) => {
  logger.info(`Syncing account ${account_id}`)
  await supabase
    .from('stripe_accounts')
    .update({
      initial_sync_started_at: new Date(),
    })
    .eq('stripe_id', account_id)
  await syncAllAccountModeData(account_id, 'live')
  await syncAllAccountModeData(account_id, 'test')
  await supabase
    .from('stripe_accounts')
    .update({
      initial_sync_complete: true,
    })
    .eq('stripe_id', account_id)
}

export const syncAllAccountModeData = async (
  account_id: string,
  mode: Mode,
) => {
  const stripe = mode === 'live' ? liveStripe : testStripe

  // TODO: the creation is really inefficient as it stands
  const { data, error } = await syncStripeAccount(account_id)

  // Customers
  for await (const stripeCustomer of stripe.customers.list({
    stripeAccount: account_id,
  })) {
    logger.info(`Syncing customer ${stripeCustomer.id}`)
    const { data, error } = await supabase.from('stripe_customers').upsert(
      {
        stripe_id: stripeCustomer.id,
        stripe_account_id: account_id,
        stripe_json: JSON.stringify(stripeCustomer),
      },
      { onConflict: 'stripe_id' },
    )
    if (error) {
      Sentry.captureException(error)
    }
  }

  // Products
  for await (const stripeProduct of stripe.products.list({
    stripeAccount: account_id,
  })) {
    logger.info(`Syncing product ${stripeProduct.id}`)
    const { data, error } = await supabase.from('stripe_products').upsert(
      {
        stripe_id: stripeProduct.id,
        stripe_account_id: account_id,
        stripe_json: JSON.stringify(stripeProduct),
      },
      { onConflict: 'stripe_id' },
    )
    if (error) {
      Sentry.captureException(error)
    }
  }

  // Prices
  for await (const stripePrice of stripe.prices.list({
    stripeAccount: account_id,
  })) {
    logger.info(`Syncing price ${stripePrice.id}`)
    const { data, error } = await supabase.from('stripe_prices').upsert(
      {
        stripe_id: stripePrice.id,
        stripe_account_id: account_id,
        stripe_json: JSON.stringify(stripePrice),
        stripe_product_id: stripePrice.product,
      },
      { onConflict: 'stripe_id' },
    )
    if (error) {
      Sentry.captureException(error)
    }
  }

  // Subscriptions & Subscription Items
  for await (const stripeSubscription of stripe.subscriptions.list({
    stripeAccount: account_id,
  })) {
    logger.info(`Syncing subscription ${stripeSubscription.id}`)
    const { data, error } = await supabase.from('stripe_subscriptions').upsert(
      {
        stripe_id: stripeSubscription.id,
        stripe_account_id: account_id,
        stripe_customer_id: stripeSubscription.customer,
        stripe_json: JSON.stringify(stripeSubscription),
        status: stripeSubscription.status,
      },
      { onConflict: 'stripe_id' },
    )
    if (error) {
      Sentry.captureException(error)
    }
    await syncStripeSubscriptionItems(account_id, stripeSubscription.id, mode)
  }
}
