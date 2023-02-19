import type { NextApiRequest, NextApiResponse } from 'next'
import { liveStripe as stripe } from '@/stripe'
import type { Readable } from 'node:stream'
import {
  syncStripeAccount,
  syncStripeCustomer,
  syncStripePrice,
  syncStripeProduct,
  syncStripeSubscriptions,
} from '@/stripe/sync'
import Stripe from 'stripe'
import { deleteStripeCustomer, deleteStripeSubscription } from '@/stripe/db'
import { storeCustomerStateAsync } from '@/store/dynamodb'

// Live webhook endpoints receive both live and test events.
const webhookSigningSecret = process.env.STRIPE_WEBHOOK_SECRET || ''

export const config = {
  api: {
    bodyParser: false,
  },
}

async function buffer(readable: Readable) {
  const chunks = []
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
  }
  return Buffer.concat(chunks)
}

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === 'POST') {
    const sig = req.headers['stripe-signature'] as string
    const buf = await buffer(req)
    const rawBody = buf.toString('utf8')

    let event
    try {
      event = stripe.webhooks.constructEvent(rawBody, sig, webhookSigningSecret)
    } catch (err: any) {
      res.status(400).json({ error: `Webhook Error: ${err.message}` })
      throw err
    }

    syncStripeAccount(event.account!)

    console.log(`Received event: ${event.id}`)
    if (event.type === 'account.updated') {
      await syncStripeAccount((event.data.object as Stripe.Account).id)
    } else if (event.type === 'account.application.authorized') {
      await syncStripeAccount(event.account!)
    } else if (event.type === 'account.application.deauthorized') {
      console.error(`${event.type} not handled`)
    } else if (event.type === 'customer.created') {
      await syncStripeCustomer(
        event.account!,
        (event.data.object as Stripe.Customer).id,
        event.livemode ? 'live' : 'test',
      )
    } else if (event.type === 'customer.deleted') {
      console.error(`${event.type} not handled`)
    } else if (event.type === 'customer.updated') {
      await syncStripeCustomer(
        event.account!,
        (event.data.object as Stripe.Customer).id,
        event.livemode ? 'live' : 'test',
      )
    } else if (event.type === 'customer.subscription.created') {
      await syncStripeSubscriptions(
        event.account!,
        (event.data.object as any).customer,
        event.livemode ? 'live' : 'test',
      )
    } else if (event.type === 'customer.subscription.deleted') {
      await deleteStripeSubscription(
        event.account!,
        (event.data.object as any).id,
      )
      await storeCustomerStateAsync(
        event.account!,
        (event.data.object as any).customer,
      )
    } else if (event.type === 'customer.subscription.updated') {
      await syncStripeSubscriptions(
        event.account!,
        (event.data.object as any).customer,
        event.livemode ? 'live' : 'test',
      )
    } else if (event.type === 'price.created') {
      await syncStripePrice(
        event.account!,
        (event.data.object as any).id,
        event.livemode ? 'live' : 'test',
      )
    } else if (event.type === 'price.deleted') {
      console.error(`${event.type} not handled`)
    } else if (event.type === 'price.updated') {
      await syncStripePrice(
        event.account!,
        (event.data.object as any).id,
        event.livemode ? 'live' : 'test',
      )
    } else if (event.type === 'product.created') {
      await syncStripeProduct(
        event.account!,
        (event.data.object as any).id,
        event.livemode ? 'live' : 'test',
      )
    } else if (event.type === 'product.deleted') {
      console.error(`${event.type} not handled`)
    } else if (event.type === 'product.updated') {
      await syncStripeProduct(
        event.account!,
        (event.data.object as any).id,
        event.livemode ? 'live' : 'test',
      )
    } else {
      console.error(`Unhandled event type ${event.type}`)
    }

    res.status(200).json({ success: true })
  } else {
    res.setHeader('Allow', 'POST')
    res.status(405).end('Method Not Allowed')
  }
}

export default handler
