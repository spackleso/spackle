import Stripe from 'stripe'
import { DatabaseService } from '@/lib/services/db'
import { Cache } from '../cache/interface'

export type Mode = 'live' | 'test'

export class StripeService {
  public liveStripe: Stripe
  public testStripe: Stripe

  private readonly dbService: DatabaseService
  private readonly cache: Cache

  constructor(
    dbService: DatabaseService,
    liveStripe: Stripe,
    testStripe: Stripe,
    cache: Cache,
  ) {
    this.dbService = dbService
    this.liveStripe = liveStripe
    this.testStripe = testStripe
    this.cache = cache
  }

  getOrSyncStripeAccount = async (stripeId: string, name?: string | null) => {
    const account = await this.dbService.getStripeAccount(stripeId)
    if (account) return account
    return await this.syncStripeAccount(stripeId, name)
  }

  syncStripeAccount = async (stripeId: string, name?: string | null) => {
    return await this.dbService.upsertStripeAccount(stripeId, name)
  }

  syncStripeUser = async (
    stripeAccountId: string,
    stripeId: string,
    email?: string | null,
    name?: string | null,
  ) => {
    return await this.dbService.upsertStripeUser(
      stripeAccountId,
      stripeId,
      email,
      name,
    )
  }

  getOrSyncStripeProduct = async (
    stripeAccountId: string,
    stripeId: string,
    mode: Mode,
  ) => {
    const product = await this.dbService.getStripeProduct(
      stripeAccountId,
      stripeId,
    )
    if (product) return product
    return await this.syncStripeProduct(stripeAccountId, stripeId, mode)
  }

  syncStripeProduct = async (
    stripeAccountId: string,
    stripeId: string,
    mode: Mode,
  ) => {
    const stripe = mode === 'live' ? this.liveStripe : this.testStripe
    const stripeProduct = await stripe.products.retrieve(stripeId, {
      stripeAccount: stripeAccountId,
    })
    const product = await this.dbService.upsertStripeProduct(
      stripeAccountId,
      stripeId,
      JSON.parse(JSON.stringify(stripeProduct)),
    )
    return product
  }

  getOrSyncStripePrice = async (
    stripeAccountId: string,
    stripeId: string,
    mode: Mode,
  ) => {
    const price = await this.dbService.getStripePrice(stripeAccountId, stripeId)
    if (price) return price
    return await this.syncStripePrice(stripeAccountId, stripeId, mode)
  }

  syncStripePrice = async (
    stripeAccountId: string,
    stripeId: string,
    mode: Mode,
  ) => {
    const stripe = mode === 'live' ? this.liveStripe : this.testStripe
    const stripePrice = await stripe.prices.retrieve(stripeId, {
      stripeAccount: stripeAccountId,
    })
    const stripeJson = JSON.parse(JSON.stringify(stripePrice))
    const stripeProductId = stripePrice.product
    await this.getOrSyncStripeProduct(
      stripeAccountId,
      stripeProductId as string,
      mode,
    )
    const price = await this.dbService.upsertStripePrice(
      stripeAccountId,
      stripeId,
      stripeProductId as string,
      stripeJson,
    )
    return price
  }

  getOrSyncStripeCustomer = async (
    stripeAccountId: string,
    stripeId: string,
    mode: Mode,
  ) => {
    const customer = await this.dbService.getStripeCustomer(
      stripeAccountId,
      stripeId,
    )
    if (customer) return customer
    return await this.syncStripeCustomer(stripeAccountId, stripeId, mode)
  }

  getOrSyncStripeCharge = async (
    stripeAccountId: string,
    stripeId: string,
    mode: Mode,
  ) => {
    const charge = await this.dbService.getStripeCharge(
      stripeAccountId,
      stripeId,
    )
    if (charge) return charge
    return await this.syncStripeCharge(stripeAccountId, stripeId, mode)
  }

  getOrSyncStripeInvoice = async (
    stripeAccountId: string,
    stripeId: string,
    mode: Mode,
  ) => {
    const invoice = await this.dbService.getStripeInvoice(
      stripeAccountId,
      stripeId,
    )
    if (invoice) return invoice
    return await this.syncStripeInvoice(stripeAccountId, stripeId, mode)
  }

  syncStripeCustomer = async (
    stripeAccountId: string,
    stripeId: string,
    mode: Mode,
  ) => {
    const stripe = mode === 'live' ? this.liveStripe : this.testStripe
    const stripeCustomer = await stripe.customers.retrieve(stripeId, {
      stripeAccount: stripeAccountId,
    })
    const stripeJson = JSON.parse(JSON.stringify(stripeCustomer))
    const customer = await this.dbService.upsertStripeCustomer(
      stripeAccountId,
      stripeId,
      stripeJson,
    )
    return customer
  }

  syncStripeSubscriptions = async (
    stripeAccountId: string,
    stripeCustomerId: string,
    mode: Mode,
  ) => {
    const stripe = mode === 'live' ? this.liveStripe : this.testStripe
    await this.getOrSyncStripeCustomer(stripeAccountId, stripeCustomerId, mode)
    for await (const subscription of stripe.subscriptions.list(
      {
        customer: stripeCustomerId,
      },
      {
        stripeAccount: stripeAccountId,
      },
    )) {
      await this.dbService.upsertStripeSubscription(
        stripeAccountId,
        subscription.id,
        stripeCustomerId,
        subscription.status,
        JSON.parse(JSON.stringify(subscription)),
      )
      await this.syncStripeSubscriptionItems(
        stripeAccountId,
        subscription.id,
        mode,
      )
    }
    await this.cache.remove(
      'customerState',
      `${stripeAccountId}:${stripeCustomerId}`,
    )
  }

  syncStripeSubscriptionItems = async (
    stripeAccountId: string,
    stripeSubscriptionId: string,
    mode: Mode,
  ) => {
    const stripe = mode === 'live' ? this.liveStripe : this.testStripe
    for await (const subscriptionItem of stripe.subscriptionItems.list(
      {
        subscription: stripeSubscriptionId,
      },
      {
        stripeAccount: stripeAccountId,
      },
    )) {
      await this.getOrSyncStripePrice(
        stripeAccountId,
        subscriptionItem.price.id,
        mode,
      )
      await this.dbService.upsertStripeSubscriptionItem(
        stripeAccountId,
        subscriptionItem.id,
        subscriptionItem.price.id,
        subscriptionItem.subscription,
        JSON.parse(JSON.stringify(subscriptionItem)),
      )
    }
  }

  syncStripeInvoice = async (
    stripeAccountId: string,
    stripeId: string,
    mode: Mode,
  ) => {
    const stripe = mode === 'live' ? this.liveStripe : this.testStripe
    const stripeInvoice = await stripe.invoices.retrieve(stripeId, {
      stripeAccount: stripeAccountId,
    })
    const stripeJson = JSON.parse(JSON.stringify(stripeInvoice))
    const invoice = await this.dbService.upsertStripeInvoice(
      stripeAccountId,
      stripeId,
      stripeJson,
      stripeInvoice.subscription as string | null,
    )
    return invoice
  }

  syncStripeCharge = async (
    stripeAccountId: string,
    stripeId: string,
    mode: Mode,
  ) => {
    const stripe = mode === 'live' ? this.liveStripe : this.testStripe
    const stripeCharge = await stripe.charges.retrieve(stripeId, {
      stripeAccount: stripeAccountId,
    })
    const stripeJson = JSON.parse(JSON.stringify(stripeCharge))
    const stripeInvoiceId = stripeCharge.invoice as string | null
    if (stripeInvoiceId) {
      await this.syncStripeInvoice(stripeAccountId, stripeInvoiceId, mode)
    }
    const charge = await this.dbService.upsertStripeCharge(
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

  handleWebhook = async (account: string, event: any) => {
    this.syncStripeAccount(account!, null)

    console.log(`Received event: ${event.id}`)
    if (event.type === 'account.updated') {
      await this.syncStripeAccount(
        (event.data.object as Stripe.Account).id,
        null,
      )
    } else if (event.type === 'account.application.authorized') {
      await this.syncStripeAccount(account!, null)
    } else if (event.type === 'account.application.deauthorized') {
      console.error(`${event.type} not handled`)
    } else if (event.type === 'customer.created') {
      await this.syncStripeCustomer(
        account!,
        (event.data.object as Stripe.Customer).id,
        event.livemode ? 'live' : 'test',
      )
    } else if (event.type === 'customer.deleted') {
      console.error(`${event.type} not handled`)
    } else if (event.type === 'customer.updated') {
      await this.syncStripeCustomer(
        account!,
        (event.data.object as Stripe.Customer).id,
        event.livemode ? 'live' : 'test',
      )
    } else if (event.type === 'customer.subscription.created') {
      await this.syncStripeSubscriptions(
        account!,
        (event.data.object as any).customer,
        event.livemode ? 'live' : 'test',
      )
    } else if (event.type === 'customer.subscription.deleted') {
      await this.dbService.deleteStripeSubscription(
        account!,
        (event.data.object as any).id,
      )
      await this.syncStripeSubscriptions(
        account!,
        (event.data.object as any).customer,
        event.livemode ? 'live' : 'test',
      )
    } else if (event.type === 'customer.subscription.updated') {
      await this.syncStripeSubscriptions(
        account!,
        (event.data.object as any).customer,
        event.livemode ? 'live' : 'test',
      )
    } else if (event.type === 'price.created') {
      await this.syncStripePrice(
        account!,
        (event.data.object as any).id,
        event.livemode ? 'live' : 'test',
      )
    } else if (event.type === 'price.deleted') {
      console.error(`${event.type} not handled`)
    } else if (event.type === 'price.updated') {
      await this.syncStripePrice(
        account!,
        (event.data.object as any).id,
        event.livemode ? 'live' : 'test',
      )
    } else if (event.type === 'product.created') {
      await this.syncStripeProduct(
        account!,
        (event.data.object as any).id,
        event.livemode ? 'live' : 'test',
      )
    } else if (event.type === 'product.deleted') {
      console.error(`${event.type} not handled`)
    } else if (event.type === 'product.updated') {
      await this.syncStripeProduct(
        account!,
        (event.data.object as any).id,
        event.livemode ? 'live' : 'test',
      )
    } else if (event.type.startsWith('invoice.')) {
      await this.syncStripeInvoice(
        account!,
        (event.data.object as any).id,
        event.livemode ? 'live' : 'test',
      )
    } else if (event.type.startsWith('charge.')) {
      await this.syncStripeCharge(
        account!,
        (event.data.object as any).id,
        event.livemode ? 'live' : 'test',
      )
    } else {
      console.error(`Unhandled event type ${event.type}`)
    }
  }
}
