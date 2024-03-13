import { Database, eq, schema } from '@spackle/db'
import Stripe from 'stripe'
import { DatabaseService } from '@/lib/db/service'
import { Toucan } from 'toucan-js'

export type Mode = 'live' | 'test'

export class StripeService {
  private readonly db: Database
  private readonly dbService: DatabaseService
  private readonly liveStripe: Stripe
  private readonly testStripe: Stripe
  private readonly sentry: Toucan

  constructor(
    db: Database,
    dbService: DatabaseService,
    liveStripe: Stripe,
    testStripe: Stripe,
    sentry: Toucan,
  ) {
    this.db = db
    this.dbService = dbService
    this.liveStripe = liveStripe
    this.testStripe = testStripe
    this.sentry = sentry
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

  syncAllAccountDataAsync = async (stripeAccountId: string) => {
    this.sentry.captureMessage(
      'called syncAllAccountDataAsync from Cloudflare Worker',
    )
    // const q = getQueue()
    // return await q.add('syncAllAccountData', { stripeAccountId })
  }

  syncAllAccountData = async (stripeAccountId: string) => {
    console.info(`Syncing account ${stripeAccountId}`)

    await this.db
      .update(schema.stripeAccounts)
      .set({
        initialSyncStartedAt: new Date().toISOString(),
      })
      .where(eq(schema.stripeAccounts.stripeId, stripeAccountId))

    try {
      await this.syncAllAccountModeData(stripeAccountId, 'live')
    } catch (error) {
      if (!(error as Error).message.includes('testmode')) {
        this.sentry.captureException(error)
        return
      }
    }

    try {
      await this.syncAllAccountModeData(stripeAccountId, 'test')
    } catch (error) {
      this.sentry.captureException(error)
      return
    }

    await this.db
      .update(schema.stripeAccounts)
      .set({
        initialSyncComplete: true,
      })
      .where(eq(schema.stripeAccounts.stripeId, stripeAccountId))
  }

  syncAllAccountModeData = async (stripeAccountId: string, mode: Mode) => {
    const stripe = mode === 'live' ? this.liveStripe : this.testStripe

    // TODO: the creation is really inefficient as it stands
    await this.syncStripeAccount(stripeAccountId)

    // Customers
    for await (const stripeCustomer of stripe.customers.list({
      stripeAccount: stripeAccountId,
    })) {
      console.info(`Syncing customer ${stripeCustomer.id}`)
      try {
        await this.dbService.upsertStripeCustomer(
          stripeAccountId,
          stripeCustomer.id,
          JSON.parse(JSON.stringify(stripeCustomer)),
        )
      } catch (error) {
        console.error(error)
        this.sentry.captureException(error)
      }
    }

    // Products
    for await (const stripeProduct of stripe.products.list({
      stripeAccount: stripeAccountId,
    })) {
      console.info(`Syncing product ${stripeProduct.id}`)
      try {
        await this.dbService.upsertStripeProduct(
          stripeAccountId,
          stripeProduct.id,
          JSON.parse(JSON.stringify(stripeProduct)),
        )
      } catch (error) {
        console.error(error)
        this.sentry.captureException(error)
      }
    }

    // Prices
    for await (const stripePrice of stripe.prices.list({
      stripeAccount: stripeAccountId,
    })) {
      console.info(`Syncing price ${stripePrice.id}`)
      try {
        await this.dbService.upsertStripePrice(
          stripeAccountId,
          stripePrice.id,
          stripePrice.product as string,
          JSON.parse(JSON.stringify(stripePrice)),
        )
      } catch (error) {
        console.error(error)
        this.sentry.captureException(error)
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
        await this.dbService.upsertStripeSubscription(
          stripeAccountId,
          stripeSubscription.id,
          stripeSubscription.customer as string,
          stripeSubscription.status,
          JSON.parse(JSON.stringify(stripeSubscription)),
        )
      } catch (error) {
        console.error(error)
        this.sentry.captureException(error)
        continue
      }

      try {
        await this.syncStripeSubscriptionItems(
          stripeAccountId,
          stripeSubscription.id,
          mode,
        )
      } catch (error) {
        console.error(error)
        this.sentry.captureException(error)
      }
    }

    // Invoices
    for await (const stripeInvoice of stripe.invoices.list({
      stripeAccount: stripeAccountId,
    })) {
      console.info(`Syncing invoice ${stripeInvoice.id}`)
      try {
        await this.dbService.upsertStripeInvoice(
          stripeAccountId,
          stripeInvoice.id as string,
          JSON.parse(JSON.stringify(stripeInvoice)),
          stripeInvoice.subscription as string | null,
        )
      } catch (error) {
        console.error(error)
        this.sentry.captureException(error)
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
          await this.getOrSyncStripeInvoice(
            stripeAccountId,
            stripeInvoiceId,
            mode,
          )
        }
        await this.dbService.upsertStripeCharge(
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
        this.sentry.captureException(error)
      }
    }
  }
}
