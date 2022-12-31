import { liveStripe, testStripe } from '@/stripe'
import { logger } from '@/logger'
import { supabase } from '@/supabase'
import * as Sentry from '@sentry/node'
import {
  getStripeAccount,
  getStripeCustomer,
  getStripePrice,
  getStripeProduct,
  upsertStripeAccount,
  upsertStripeCustomer,
  upsertStripePrice,
  upsertStripeProduct,
  upsertStripeSubscription,
  upsertStripeSubscriptionItem,
} from './db'
import { Mode } from '@/types'
import { storeAccountStatesAsync, storeCustomerState } from '@/store/dynamodb'

export const getOrSyncStripeAccount = async (stripe_id: string) => {
  const account = await getStripeAccount(stripe_id)
  if (account) return account
  return await syncStripeAccount(stripe_id)
}

export const syncStripeAccount = async (stripe_id: string) => {
  return await upsertStripeAccount(stripe_id)
}

export const getOrSyncStripeProduct = async (
  stripe_account_id: string,
  stripe_id: string,
  mode: Mode,
) => {
  const product = await getStripeProduct(stripe_account_id, stripe_id)
  if (product) return product
  return await syncStripeProduct(stripe_account_id, stripe_id, mode)
}

export const syncStripeProduct = async (
  stripe_account_id: string,
  stripe_id: string,
  mode: Mode,
) => {
  const stripe = mode === 'live' ? liveStripe : testStripe
  const stripeProduct = await stripe.products.retrieve(stripe_id, {
    stripeAccount: stripe_account_id,
  })
  const stripe_json = JSON.stringify(stripeProduct)
  const product = await upsertStripeProduct(
    stripe_account_id,
    stripe_id,
    stripe_json,
  )
  await storeAccountStatesAsync(stripe_account_id)
  return product
}

export const getOrSyncStripePrice = async (
  stripe_account_id: string,
  stripe_id: string,
  mode: Mode,
) => {
  const price = await getStripePrice(stripe_account_id, stripe_id)
  if (price) return price
  return await syncStripePrice(stripe_account_id, stripe_id, mode)
}

export const syncStripePrice = async (
  stripe_account_id: string,
  stripe_id: string,
  mode: Mode,
) => {
  const stripe = mode === 'live' ? liveStripe : testStripe
  const stripePrice = await stripe.prices.retrieve(stripe_id, {
    stripeAccount: stripe_account_id,
  })
  const stripe_json = JSON.stringify(stripePrice)
  const stripe_product_id = stripePrice.product
  const price = await upsertStripePrice(
    stripe_account_id,
    stripe_id,
    stripe_product_id as string,
    stripe_json,
  )
  await storeAccountStatesAsync(stripe_account_id)
  return price
}

export const getOrSyncStripeCustomer = async (
  stripe_account_id: string,
  stripe_id: string,
  mode: Mode,
) => {
  const customer = await getStripeCustomer(stripe_account_id, stripe_id)
  if (customer) return customer
  return await syncStripeCustomer(stripe_account_id, stripe_id, mode)
}

export const syncStripeCustomer = async (
  stripe_account_id: string,
  stripe_id: string,
  mode: Mode,
) => {
  const stripe = mode === 'live' ? liveStripe : testStripe
  const stripeCustomer = await stripe.customers.retrieve(stripe_id, {
    stripeAccount: stripe_account_id,
  })
  const stripe_json = JSON.stringify(stripeCustomer)
  const customer = await upsertStripeCustomer(
    stripe_account_id,
    stripe_id,
    stripe_json,
  )
  await storeCustomerState(stripe_account_id, stripe_id)
  return customer
}

export const syncStripeSubscriptions = async (
  stripe_account_id: string,
  stripe_customer_id: string,
  mode: Mode,
) => {
  const stripe = mode === 'live' ? liveStripe : testStripe
  for await (const subscription of stripe.subscriptions.list(
    {
      customer: stripe_customer_id,
    },
    {
      stripeAccount: stripe_account_id,
    },
  )) {
    await upsertStripeSubscription(
      stripe_account_id,
      subscription.id,
      stripe_customer_id,
      subscription.status,
      JSON.stringify(subscription),
    )
    await syncStripeSubscriptionItems(stripe_account_id, subscription.id, mode)
  }
  await storeCustomerState(stripe_account_id, stripe_customer_id)
}

export const syncStripeSubscriptionItems = async (
  stripe_account_id: string,
  stripe_subscription_id: string,
  mode: Mode,
) => {
  const stripe = mode === 'live' ? liveStripe : testStripe
  for await (const subscriptionItem of stripe.subscriptionItems.list(
    {
      subscription: stripe_subscription_id,
    },
    {
      stripeAccount: stripe_account_id,
    },
  )) {
    await upsertStripeSubscriptionItem(
      stripe_account_id,
      subscriptionItem.id,
      subscriptionItem.price.id,
      subscriptionItem.subscription,
      JSON.stringify(subscriptionItem),
    )
  }
}

export const syncAllAccountData = async (account_id: string) => {
  logger.info(`Syncing account ${account_id}`)
  await supabase
    .from('stripe_accounts')
    .update({
      initial_sync_started_at: new Date() as any,
    })
    .eq('stripe_id', account_id)

  try {
    await syncAllAccountModeData(account_id, 'live')
  } catch (error) {
    if (!(error as Error).message.includes('testmode')) {
      Sentry.captureException(error)
      return
    }
  }

  try {
    await syncAllAccountModeData(account_id, 'test')
  } catch (error) {
    Sentry.captureException(error)
    return
  }

  await supabase
    .from('stripe_accounts')
    .update({
      initial_sync_complete: true,
    })
    .eq('stripe_id', account_id)
}

export const syncAllAccountModeData = async (
  stripe_account_id: string,
  mode: Mode,
) => {
  const stripe = mode === 'live' ? liveStripe : testStripe

  // TODO: the creation is really inefficient as it stands
  await syncStripeAccount(stripe_account_id)

  // Customers
  for await (const stripeCustomer of stripe.customers.list({
    stripeAccount: stripe_account_id,
  })) {
    logger.info(`Syncing customer ${stripeCustomer.id}`)
    try {
      await upsertStripeCustomer(
        stripe_account_id,
        stripeCustomer.id,
        JSON.stringify(stripeCustomer),
      )
    } catch (error) {
      Sentry.captureException(error)
    }
  }

  // Products
  for await (const stripeProduct of stripe.products.list({
    stripeAccount: stripe_account_id,
  })) {
    logger.info(`Syncing product ${stripeProduct.id}`)
    try {
      await upsertStripeProduct(
        stripe_account_id,
        stripeProduct.id,
        JSON.stringify(stripeProduct),
      )
    } catch (error) {
      Sentry.captureException(error)
    }
  }

  // Prices
  for await (const stripePrice of stripe.prices.list({
    stripeAccount: stripe_account_id,
  })) {
    logger.info(`Syncing price ${stripePrice.id}`)
    try {
      await upsertStripePrice(
        stripe_account_id,
        stripePrice.id,
        stripePrice.product as string,
        JSON.stringify(stripePrice),
      )
    } catch (error) {
      Sentry.captureException(error)
    }
  }

  // Subscriptions & Subscription Items
  for await (const stripeSubscription of stripe.subscriptions.list({
    stripeAccount: stripe_account_id,
  })) {
    logger.info(`Syncing subscription ${stripeSubscription.id}`)
    try {
      await upsertStripeSubscription(
        stripe_account_id,
        stripeSubscription.id,
        stripeSubscription.customer as string,
        stripeSubscription.status,
        JSON.stringify(stripeSubscription),
      )
    } catch (error) {
      Sentry.captureException(error)
    }
    await syncStripeSubscriptionItems(
      stripe_account_id,
      stripeSubscription.id,
      mode,
    )
  }
}
