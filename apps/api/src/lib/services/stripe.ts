import { Database, eq, schema } from '@spackle/db'
import Stripe from 'stripe'
import { DatabaseService } from '@/lib/services/db'
import { Toucan } from 'toucan-js'

export type Mode = 'live' | 'test'

export const SYNC_OPS = [
  'syncAllCustomers',
  'syncAllProducts',
  'syncAllPrices',
  'syncAllSubscriptions',
  'syncAllInvoices',
  'syncAllCharges',
]

export class StripeService {
  private readonly db: Database
  private readonly dbService: DatabaseService
  private readonly liveStripe: Stripe
  private readonly testStripe: Stripe
  private readonly sentry: Toucan
  private readonly queue: Queue

  constructor(
    db: Database,
    dbService: DatabaseService,
    liveStripe: Stripe,
    testStripe: Stripe,
    sentry: Toucan,
    queue: Queue,
  ) {
    this.db = db
    this.dbService = dbService
    this.liveStripe = liveStripe
    this.testStripe = testStripe
    this.queue = queue
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

  syncAllAccountData = async (stripeAccountId: string) => {
    console.info(`Syncing account ${stripeAccountId}`)

    await this.db
      .update(schema.stripeAccounts)
      .set({
        initialSyncStartedAt: new Date().toISOString(),
      })
      .where(eq(schema.stripeAccounts.stripeId, stripeAccountId))

    const syncJob = (
      await this.db
        .insert(schema.syncJobs)
        .values({
          stripeAccountId,
        })
        .returning()
    )[0]

    for (const mode of ['live', 'test'] as Mode[]) {
      for (const op of SYNC_OPS) {
        await this.queue.send({
          type: op,
          payload: {
            stripeAccountId,
            mode,
            syncJobId: syncJob.id,
          },
        })
      }
    }
  }

  maybeFinishSyncJob = async (
    stripeAccountId: string,
    mode: Mode,
    syncJobId: number,
  ) => {
    let syncJob = (
      await this.db
        .select()
        .from(schema.syncJobs)
        .where(eq(schema.syncJobs.id, syncJobId))
    )[0]

    const modeCheckpoints: (keyof typeof syncJob)[] = [
      `${mode}ModeCustomersComplete`,
      `${mode}ModeProductsComplete`,
      `${mode}ModePricesComplete`,
      `${mode}ModeSubscriptionsComplete`,
      `${mode}ModeInvoicesComplete`,
      `${mode}ModeChargesComplete`,
    ]

    const modeComplete = modeCheckpoints.every(
      (checkpoint) => syncJob[checkpoint],
    )

    if (modeComplete) {
      syncJob = (
        await this.db
          .update(schema.syncJobs)
          .set({
            [`${mode}ModeComplete`]: true,
          })
          .where(eq(schema.syncJobs.id, syncJobId))
          .returning()
      )[0]
    }

    if (syncJob.liveModeComplete && syncJob.testModeComplete) {
      await this.db
        .update(schema.stripeAccounts)
        .set({
          initialSyncComplete: true,
        })
        .where(eq(schema.stripeAccounts.stripeId, stripeAccountId))
    }
  }

  syncAllCustomers = async (
    stripeAccountId: string,
    mode: Mode,
    syncJobId: number,
  ) => {
    const stripe = mode === 'live' ? this.liveStripe : this.testStripe
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
    await this.db
      .update(schema.syncJobs)
      .set({
        [`${mode}ModeCustomersComplete`]: true,
      })
      .where(eq(schema.syncJobs.id, syncJobId))
    await this.maybeFinishSyncJob(stripeAccountId, mode, syncJobId)
  }

  syncAllProducts = async (
    stripeAccountId: string,
    mode: Mode,
    syncJobId: number,
  ) => {
    const stripe = mode === 'live' ? this.liveStripe : this.testStripe
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
    await this.db
      .update(schema.syncJobs)
      .set({
        [`${mode}ModeProductsComplete`]: true,
      })
      .where(eq(schema.syncJobs.id, syncJobId))
    await this.maybeFinishSyncJob(stripeAccountId, mode, syncJobId)
  }

  syncAllPrices = async (
    stripeAccountId: string,
    mode: Mode,
    syncJobId: number,
  ) => {
    const stripe = mode === 'live' ? this.liveStripe : this.testStripe
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
    await this.db
      .update(schema.syncJobs)
      .set({
        [`${mode}ModePricesComplete`]: true,
      })
      .where(eq(schema.syncJobs.id, syncJobId))
    await this.maybeFinishSyncJob(stripeAccountId, mode, syncJobId)
  }

  syncAllSubscriptions = async (
    stripeAccountId: string,
    mode: Mode,
    syncJobId: number,
  ) => {
    const stripe = mode === 'live' ? this.liveStripe : this.testStripe
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
    await this.db
      .update(schema.syncJobs)
      .set({
        [`${mode}ModeSubscriptionsComplete`]: true,
      })
      .where(eq(schema.syncJobs.id, syncJobId))
    await this.maybeFinishSyncJob(stripeAccountId, mode, syncJobId)
  }

  syncAllInvoices = async (
    stripeAccountId: string,
    mode: Mode,
    syncJobId: number,
  ) => {
    const stripe = mode === 'live' ? this.liveStripe : this.testStripe
    for await (const stripeInvoice of stripe.invoices.list({})) {
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
    await this.db
      .update(schema.syncJobs)
      .set({
        [`${mode}ModeInvoicesComplete`]: true,
      })
      .where(eq(schema.syncJobs.id, syncJobId))
    await this.maybeFinishSyncJob(stripeAccountId, mode, syncJobId)
  }

  syncAllCharges = async (
    stripeAccountId: string,
    mode: Mode,
    syncJobId: number,
  ) => {
    const stripe = mode === 'live' ? this.liveStripe : this.testStripe
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
    await this.db
      .update(schema.syncJobs)
      .set({
        [`${mode}ModeChargesComplete`]: true,
      })
      .where(eq(schema.syncJobs.id, syncJobId))
    await this.maybeFinishSyncJob(stripeAccountId, mode, syncJobId)
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
