import * as Sentry from '@sentry/node'
import {
  getStripeAccount,
  getStripeCharge,
  getStripeCustomer,
  getStripeInvoice,
  getStripePrice,
  getStripeProduct,
  upsertStripeAccount,
  upsertStripeCharge,
  upsertStripeCustomer,
  upsertStripeInvoice,
  upsertStripePrice,
  upsertStripeProduct,
  upsertStripeSubscription,
  upsertStripeSubscriptionItem,
  upsertStripeUser,
} from '@/stripe/db'
import { Mode } from '@/types'
import { storeAccountStatesAsync, storeCustomerState } from '@/store/dynamodb'
import { getQueue } from '@/queue'
import db, { stripeAccounts } from '@/db'
import { eq } from 'drizzle-orm'
import { liveStripe, testStripe } from '@/stripe'

export const getOrSyncStripeAccount = async (
  stripeId: string,
  name?: string | null,
) => {
  const account = await getStripeAccount(stripeId)
  if (account) return account
  return await syncStripeAccount(stripeId, name)
}

export const syncStripeAccount = async (
  stripeId: string,
  name?: string | null,
) => {
  return await upsertStripeAccount(stripeId, name)
}

export const syncStripeUser = async (
  stripeAccountId: string,
  stripeId: string,
  email?: string | null,
  name?: string | null,
) => {
  return await upsertStripeUser(stripeAccountId, stripeId, email, name)
}

export const getOrSyncStripeProduct = async (
  stripeAccountId: string,
  stripeId: string,
  mode: Mode,
) => {
  const product = await getStripeProduct(stripeAccountId, stripeId)
  if (product) return product
  return await syncStripeProduct(stripeAccountId, stripeId, mode)
}

export const syncStripeProduct = async (
  stripeAccountId: string,
  stripeId: string,
  mode: Mode,
) => {
  const stripe = mode === 'live' ? liveStripe : testStripe
  const stripeProduct = await stripe.products.retrieve(stripeId, {
    stripeAccount: stripeAccountId,
  })
  const product = await upsertStripeProduct(
    stripeAccountId,
    stripeId,
    JSON.parse(JSON.stringify(stripeProduct)),
  )
  await storeAccountStatesAsync(stripeAccountId)
  return product
}

export const getOrSyncStripePrice = async (
  stripeAccountId: string,
  stripeId: string,
  mode: Mode,
) => {
  const price = await getStripePrice(stripeAccountId, stripeId)
  if (price) return price
  return await syncStripePrice(stripeAccountId, stripeId, mode)
}

export const syncStripePrice = async (
  stripeAccountId: string,
  stripeId: string,
  mode: Mode,
) => {
  const stripe = mode === 'live' ? liveStripe : testStripe
  const stripePrice = await stripe.prices.retrieve(stripeId, {
    stripeAccount: stripeAccountId,
  })
  const stripeJson = JSON.parse(JSON.stringify(stripePrice))
  const stripeProductId = stripePrice.product
  await getOrSyncStripeProduct(stripeAccountId, stripeProductId as string, mode)
  const price = await upsertStripePrice(
    stripeAccountId,
    stripeId,
    stripeProductId as string,
    stripeJson,
  )
  await storeAccountStatesAsync(stripeAccountId)
  return price
}

export const getOrSyncStripeCustomer = async (
  stripeAccountId: string,
  stripeId: string,
  mode: Mode,
) => {
  const customer = await getStripeCustomer(stripeAccountId, stripeId)
  if (customer) return customer
  return await syncStripeCustomer(stripeAccountId, stripeId, mode)
}

export const getOrSyncStripeCharge = async (
  stripeAccountId: string,
  stripeId: string,
  mode: Mode,
) => {
  const charge = await getStripeCharge(stripeAccountId, stripeId)
  if (charge) return charge
  return await syncStripeCharge(stripeAccountId, stripeId, mode)
}

export const getOrSyncStripeInvoice = async (
  stripeAccountId: string,
  stripeId: string,
  mode: Mode,
) => {
  const invoice = await getStripeInvoice(stripeAccountId, stripeId)
  if (invoice) return invoice
  return await syncStripeInvoice(stripeAccountId, stripeId, mode)
}

export const syncStripeCustomer = async (
  stripeAccountId: string,
  stripeId: string,
  mode: Mode,
) => {
  const stripe = mode === 'live' ? liveStripe : testStripe
  const stripeCustomer = await stripe.customers.retrieve(stripeId, {
    stripeAccount: stripeAccountId,
  })
  const stripeJson = JSON.parse(JSON.stringify(stripeCustomer))
  const customer = await upsertStripeCustomer(
    stripeAccountId,
    stripeId,
    stripeJson,
  )
  await storeCustomerState(stripeAccountId, stripeId)
  return customer
}

export const syncStripeSubscriptions = async (
  stripeAccountId: string,
  stripeCustomerId: string,
  mode: Mode,
) => {
  const stripe = mode === 'live' ? liveStripe : testStripe
  await getOrSyncStripeCustomer(stripeAccountId, stripeCustomerId, mode)
  for await (const subscription of stripe.subscriptions.list(
    {
      customer: stripeCustomerId,
    },
    {
      stripeAccount: stripeAccountId,
    },
  )) {
    await upsertStripeSubscription(
      stripeAccountId,
      subscription.id,
      stripeCustomerId,
      subscription.status,
      JSON.parse(JSON.stringify(subscription)),
    )
    await syncStripeSubscriptionItems(stripeAccountId, subscription.id, mode)
  }
  await storeCustomerState(stripeAccountId, stripeCustomerId)
}

export const syncStripeSubscriptionItems = async (
  stripeAccountId: string,
  stripeSubscriptionId: string,
  mode: Mode,
) => {
  const stripe = mode === 'live' ? liveStripe : testStripe
  for await (const subscriptionItem of stripe.subscriptionItems.list(
    {
      subscription: stripeSubscriptionId,
    },
    {
      stripeAccount: stripeAccountId,
    },
  )) {
    await getOrSyncStripePrice(stripeAccountId, subscriptionItem.price.id, mode)
    await upsertStripeSubscriptionItem(
      stripeAccountId,
      subscriptionItem.id,
      subscriptionItem.price.id,
      subscriptionItem.subscription,
      JSON.parse(JSON.stringify(subscriptionItem)),
    )
  }
}

export const syncStripeInvoice = async (
  stripeAccountId: string,
  stripeId: string,
  mode: Mode,
) => {
  const stripe = mode === 'live' ? liveStripe : testStripe
  const stripeInvoice = await stripe.invoices.retrieve(stripeId, {
    stripeAccount: stripeAccountId,
  })
  const stripeJson = JSON.parse(JSON.stringify(stripeInvoice))
  const invoice = await upsertStripeInvoice(
    stripeAccountId,
    stripeId,
    stripeJson,
    stripeInvoice.subscription as string | null,
  )
  return invoice
}

export const syncStripeCharge = async (
  stripeAccountId: string,
  stripeId: string,
  mode: Mode,
) => {
  const stripe = mode === 'live' ? liveStripe : testStripe
  const stripeCharge = await stripe.charges.retrieve(stripeId, {
    stripeAccount: stripeAccountId,
  })
  const stripeJson = JSON.parse(JSON.stringify(stripeCharge))
  const stripeInvoiceId = stripeCharge.invoice as string | null
  if (stripeInvoiceId) {
    await syncStripeInvoice(stripeAccountId, stripeInvoiceId, mode)
  }
  const charge = await upsertStripeCharge(
    stripeAccountId,
    stripeId,
    stripeCharge.amount,
    mode,
    stripeCharge.status,
    stripeCharge.created,
    stripeInvoiceId,
    stripeJson,
  )
  return charge
}

export const syncAllAccountDataAsync = async (stripeAccountId: string) => {
  const q = getQueue()
  return await q.add('syncAllAccountData', { stripeAccountId })
}

export const syncAllAccountData = async (stripeAccountId: string) => {
  console.info(`Syncing account ${stripeAccountId}`)

  await db
    .update(stripeAccounts)
    .set({
      initialSyncStartedAt: new Date().toISOString(),
    })
    .where(eq(stripeAccounts.stripeId, stripeAccountId))

  try {
    await syncAllAccountModeData(stripeAccountId, 'live')
  } catch (error) {
    if (!(error as Error).message.includes('testmode')) {
      Sentry.captureException(error)
      return
    }
  }

  try {
    await syncAllAccountModeData(stripeAccountId, 'test')
  } catch (error) {
    Sentry.captureException(error)
    return
  }

  await db
    .update(stripeAccounts)
    .set({
      initialSyncComplete: true,
    })
    .where(eq(stripeAccounts.stripeId, stripeAccountId))
}

export const syncAllAccountModeData = async (
  stripeAccountId: string,
  mode: Mode,
) => {
  const stripe = mode === 'live' ? liveStripe : testStripe

  // TODO: the creation is really inefficient as it stands
  await syncStripeAccount(stripeAccountId)

  // Customers
  for await (const stripeCustomer of stripe.customers.list({
    stripeAccount: stripeAccountId,
  })) {
    console.info(`Syncing customer ${stripeCustomer.id}`)
    try {
      await upsertStripeCustomer(
        stripeAccountId,
        stripeCustomer.id,
        JSON.parse(JSON.stringify(stripeCustomer)),
      )
    } catch (error) {
      console.error(error)
      Sentry.captureException(error)
    }
  }

  // Products
  for await (const stripeProduct of stripe.products.list({
    stripeAccount: stripeAccountId,
  })) {
    console.info(`Syncing product ${stripeProduct.id}`)
    try {
      await upsertStripeProduct(
        stripeAccountId,
        stripeProduct.id,
        JSON.parse(JSON.stringify(stripeProduct)),
      )
    } catch (error) {
      console.error(error)
      Sentry.captureException(error)
    }
  }

  // Prices
  for await (const stripePrice of stripe.prices.list({
    stripeAccount: stripeAccountId,
  })) {
    console.info(`Syncing price ${stripePrice.id}`)
    try {
      await upsertStripePrice(
        stripeAccountId,
        stripePrice.id,
        stripePrice.product as string,
        JSON.parse(JSON.stringify(stripePrice)),
      )
    } catch (error) {
      console.error(error)
      Sentry.captureException(error)
    }
  }

  // Subscriptions & Subscription Items
  for await (const stripeSubscription of stripe.subscriptions.list(
    { status: 'all' },
    {
      stripeAccount: stripeAccountId,
    },
  )) {
    console.info(`Syncing subscription ${stripeSubscription.id}`)
    try {
      await upsertStripeSubscription(
        stripeAccountId,
        stripeSubscription.id,
        stripeSubscription.customer as string,
        stripeSubscription.status,
        JSON.parse(JSON.stringify(stripeSubscription)),
      )
    } catch (error) {
      console.error(error)
      Sentry.captureException(error)
      continue
    }

    try {
      await syncStripeSubscriptionItems(
        stripeAccountId,
        stripeSubscription.id,
        mode,
      )
    } catch (error) {
      console.error(error)
      Sentry.captureException(error)
    }
  }

  // Invoices
  for await (const stripeInvoice of stripe.invoices.list({
    stripeAccount: stripeAccountId,
  })) {
    console.info(`Syncing invoice ${stripeInvoice.id}`)
    try {
      await upsertStripeInvoice(
        stripeAccountId,
        stripeInvoice.id as string,
        JSON.parse(JSON.stringify(stripeInvoice)),
        stripeInvoice.subscription as string | null,
      )
    } catch (error) {
      console.error(error)
      Sentry.captureException(error)
    }
  }

  // Charges
  for await (const stripeCharge of stripe.charges.list({
    stripeAccount: stripeAccountId,
  })) {
    console.info(`Syncing charge ${stripeCharge.id}`)
    try {
      const stripeInvoiceId = stripeCharge.invoice as string | null
      if (stripeInvoiceId) {
        await getOrSyncStripeInvoice(stripeAccountId, stripeInvoiceId, mode)
      }
      await upsertStripeCharge(
        stripeAccountId,
        stripeCharge.id as string,
        stripeCharge.amount,
        mode,
        stripeCharge.status,
        stripeCharge.created,
        stripeInvoiceId,
        JSON.parse(JSON.stringify(stripeCharge)),
      )
    } catch (error) {
      console.error(error)
      Sentry.captureException(error)
    }
  }
}
