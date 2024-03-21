import { Mode, StripeService } from '@/lib/services/stripe'
import { Database, eq, schema } from '@spackle/db'
import { DatabaseService } from '@/lib/services/db'
import { Toucan } from 'toucan-js'
import Stripe from 'stripe'

export class SyncService {
  private readonly db: Database
  private readonly dbService: DatabaseService
  private readonly queue: Queue
  private readonly sentry: Toucan
  private readonly liveStripe: Stripe
  private readonly testStripe: Stripe
  private readonly stripeService: StripeService

  private readonly modeSteps: Mode[] = ['live', 'test']
  private readonly pipelineSteps = [
    'syncAllCustomers',
    'syncAllProducts',
    'syncAllPrices',
    'syncAllSubscriptions',
    'syncAllInvoices',
    'syncAllCharges',
  ]
  private readonly pipelineOps = [
    SyncService.prototype.syncAllCustomers,
    SyncService.prototype.syncAllProducts,
    SyncService.prototype.syncAllPrices,
    SyncService.prototype.syncAllSubscriptions,
    SyncService.prototype.syncAllInvoices,
    SyncService.prototype.syncAllCharges,
  ]

  constructor(
    db: Database,
    dbService: DatabaseService,
    queue: Queue,
    sentry: Toucan,
    stripeService: StripeService,
  ) {
    this.db = db
    this.queue = queue
    this.dbService = dbService
    this.sentry = sentry
    this.stripeService = stripeService
    this.liveStripe = this.stripeService.liveStripe
    this.testStripe = this.stripeService.testStripe
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
          modeStep: this.modeSteps[0],
          pipelineStep: this.pipelineSteps[0],
        })
        .returning()
    )[0]

    await this.queue.send({
      type: 'sync',
      payload: {
        syncJobId: syncJob.id,
      },
    })
  }

  public async sync(syncJobId: number) {
    console.info(`Syncing job ${syncJobId}`)

    const syncJob = (
      await this.db
        .select()
        .from(schema.syncJobs)
        .where(eq(schema.syncJobs.id, syncJobId))
    )[0]

    if (!syncJob) {
      throw new Error(`Sync job ${syncJobId} not found`)
    }

    const pipeline = syncJob.pipelineStep as string
    const op = this[pipeline as keyof SyncService] as any

    console.info(
      `Running pipeline step ${pipeline} for mode ${syncJob.modeStep} from checkpoint ${syncJob.pipelineStepCheckpoint}`,
    )
    const nextCheckpoint = await op(
      syncJob.stripeAccountId,
      syncJob.modeStep as Mode,
      syncJob.pipelineStepCheckpoint,
      100,
    )

    let finished = false
    if (nextCheckpoint) {
      await this.db.update(schema.syncJobs).set({
        pipelineStepCheckpoint: nextCheckpoint,
      })
    } else {
      const nextPipelineIndex = this.pipelineSteps.indexOf(pipeline) + 1
      const nextModeIndex = this.modeSteps.indexOf(syncJob.modeStep as Mode) + 1

      if (nextPipelineIndex < this.pipelineSteps.length) {
        await this.db.update(schema.syncJobs).set({
          pipelineStep: this.pipelineSteps[nextPipelineIndex],
          pipelineStepCheckpoint: null,
        })
      } else if (nextModeIndex < this.modeSteps.length) {
        await this.db.update(schema.syncJobs).set({
          modeStep: this.modeSteps[nextModeIndex],
          pipelineStep: this.pipelineSteps[0],
          pipelineStepCheckpoint: null,
        })
      } else {
        await this.db.update(schema.stripeAccounts).set({
          initialSyncComplete: true,
        })
        finished = true
      }
    }

    if (!finished) {
      await this.queue.send({
        type: 'sync',
        payload: {
          syncJobId: syncJobId,
        },
      })
    }
  }

  syncAllCustomers = async (
    stripeAccountId: string,
    mode: Mode,
    cursor: string | null,
    limit: number,
  ): Promise<string | null> => {
    const stripe = mode === 'live' ? this.liveStripe : this.testStripe

    const stripeCustomers = await stripe.customers.list(
      {
        limit,
        starting_after: cursor || undefined,
      },
      {
        stripeAccount: stripeAccountId,
      },
    )

    for (const stripeCustomer of stripeCustomers.data) {
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

    if (stripeCustomers.has_more) {
      return stripeCustomers.data[stripeCustomers.data.length - 1].id
    }

    return null
  }

  syncAllProducts = async (
    stripeAccountId: string,
    mode: Mode,
    cursor: string | null,
    limit: number,
  ) => {
    const stripe = mode === 'live' ? this.liveStripe : this.testStripe
    const stripeProducts = await stripe.products.list(
      {
        limit,
        starting_after: cursor || undefined,
      },
      {
        stripeAccount: stripeAccountId,
      },
    )

    for (const stripeProduct of stripeProducts.data) {
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

    if (stripeProducts.has_more) {
      return stripeProducts.data[stripeProducts.data.length - 1].id
    }

    return null
  }

  syncAllPrices = async (
    stripeAccountId: string,
    mode: Mode,
    cursor: string | null,
    limit: number,
  ) => {
    const stripe = mode === 'live' ? this.liveStripe : this.testStripe
    const stripePrices = await stripe.prices.list(
      {
        limit,
        starting_after: cursor || undefined,
      },
      {
        stripeAccount: stripeAccountId,
      },
    )

    for (const stripePrice of stripePrices.data) {
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

    if (stripePrices.has_more) {
      return stripePrices.data[stripePrices.data.length - 1].id
    }

    return null
  }

  syncAllSubscriptions = async (
    stripeAccountId: string,
    mode: Mode,
    cursor: string | null,
    limit: number,
  ) => {
    const stripe = mode === 'live' ? this.liveStripe : this.testStripe
    const stripeSubscriptions = await stripe.subscriptions.list(
      {
        limit,
        starting_after: cursor || undefined,
      },
      {
        stripeAccount: stripeAccountId,
      },
    )

    for (const stripeSubscription of stripeSubscriptions.data) {
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
      }

      try {
        await this.stripeService.syncStripeSubscriptionItems(
          stripeAccountId,
          stripeSubscription.id,
          mode,
        )
      } catch (error) {
        console.error(error)
        this.sentry.captureException(error)
      }
    }

    if (stripeSubscriptions.has_more) {
      return stripeSubscriptions.data[stripeSubscriptions.data.length - 1].id
    }

    return null
  }

  syncAllInvoices = async (
    stripeAccountId: string,
    mode: Mode,
    cursor: string | null,
    limit: number,
  ) => {
    const stripe = mode === 'live' ? this.liveStripe : this.testStripe
    const stripeInvoices = await stripe.invoices.list(
      {
        limit,
        starting_after: cursor || undefined,
      },
      {
        stripeAccount: stripeAccountId,
      },
    )

    for (const stripeInvoice of stripeInvoices.data) {
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

    if (stripeInvoices.has_more) {
      return stripeInvoices.data[stripeInvoices.data.length - 1].id
    }

    return null
  }

  syncAllCharges = async (
    stripeAccountId: string,
    mode: Mode,
    cursor: string | null,
    limit: number,
  ) => {
    const stripe = mode === 'live' ? this.liveStripe : this.testStripe
    const stripeCharges = await stripe.charges.list(
      {
        limit,
        starting_after: cursor || undefined,
      },
      {
        stripeAccount: stripeAccountId,
      },
    )

    for (const stripeCharge of stripeCharges.data) {
      console.info(`Syncing charge ${stripeCharge.id}`)
      try {
        const stripeInvoiceId = stripeCharge.invoice as string | null
        if (stripeInvoiceId) {
          await this.stripeService.getOrSyncStripeInvoice(
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

    if (stripeCharges.has_more) {
      return stripeCharges.data[stripeCharges.data.length - 1].id
    }

    return null
  }
}
