import type { NextApiRequest } from 'next'
import {
  syncStripeAccount,
  syncStripeCustomer,
  syncStripeInvoice,
  syncStripePrice,
  syncStripeProduct,
  syncStripeSubscriptions,
} from '@/stripe/sync'
import Stripe from 'stripe'
import { deleteStripeSubscription } from '@/stripe/db'
import { storeCustomerStateAsync } from '@/store/dynamodb'
import type { Readable } from 'node:stream'

export async function buffer(readable: Readable) {
  const chunks = []
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
  }
  return Buffer.concat(chunks)
}

export const handleWebhook = async (account: string, event: any) => {
  syncStripeAccount(account!, null)

  console.log(`Received event: ${event.id}`)
  if (event.type === 'account.updated') {
    await syncStripeAccount((event.data.object as Stripe.Account).id, null)
  } else if (event.type === 'account.application.authorized') {
    await syncStripeAccount(account!, null)
  } else if (event.type === 'account.application.deauthorized') {
    console.error(`${event.type} not handled`)
  } else if (event.type === 'customer.created') {
    await syncStripeCustomer(
      account!,
      (event.data.object as Stripe.Customer).id,
      event.livemode ? 'live' : 'test',
    )
  } else if (event.type === 'customer.deleted') {
    console.error(`${event.type} not handled`)
  } else if (event.type === 'customer.updated') {
    await syncStripeCustomer(
      account!,
      (event.data.object as Stripe.Customer).id,
      event.livemode ? 'live' : 'test',
    )
  } else if (event.type === 'customer.subscription.created') {
    await syncStripeSubscriptions(
      account!,
      (event.data.object as any).customer,
      event.livemode ? 'live' : 'test',
    )
  } else if (event.type === 'customer.subscription.deleted') {
    await deleteStripeSubscription(account!, (event.data.object as any).id)
    await storeCustomerStateAsync(account!, (event.data.object as any).customer)
  } else if (event.type === 'customer.subscription.updated') {
    await syncStripeSubscriptions(
      account!,
      (event.data.object as any).customer,
      event.livemode ? 'live' : 'test',
    )
  } else if (event.type === 'price.created') {
    await syncStripePrice(
      account!,
      (event.data.object as any).id,
      event.livemode ? 'live' : 'test',
    )
  } else if (event.type === 'price.deleted') {
    console.error(`${event.type} not handled`)
  } else if (event.type === 'price.updated') {
    await syncStripePrice(
      account!,
      (event.data.object as any).id,
      event.livemode ? 'live' : 'test',
    )
  } else if (event.type === 'product.created') {
    await syncStripeProduct(
      account!,
      (event.data.object as any).id,
      event.livemode ? 'live' : 'test',
    )
  } else if (event.type === 'product.deleted') {
    console.error(`${event.type} not handled`)
  } else if (event.type === 'product.updated') {
    await syncStripeProduct(
      account!,
      (event.data.object as any).id,
      event.livemode ? 'live' : 'test',
    )
  } else if (event.type.startsWith('invoice.')) {
    await syncStripeInvoice(
      account!,
      (event.data.data.object as any).id,
      event.livemode ? 'live' : 'test',
    )
  } else {
    console.error(`Unhandled event type ${event.type}`)
  }
}
