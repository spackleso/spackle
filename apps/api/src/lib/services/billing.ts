import { Database, and, eq, gte, isNotNull, lt, schema, sql } from '@spackle/db'
import { DatabaseService } from '@/lib/services/db'
import { EntitlementsService } from '@/lib/services/entitlements'

export const FREE_TIER = 1000

export class BillingService {
  private readonly db: Database
  private readonly dbService: DatabaseService
  private readonly entitlementsService: EntitlementsService
  private readonly billingAccountStripeId: string

  constructor(
    db: Database,
    dbService: DatabaseService,
    entitlementsService: EntitlementsService,
    billingAccountStripeId: string,
  ) {
    this.db = db
    this.dbService = dbService
    this.entitlementsService = entitlementsService
    this.billingAccountStripeId = billingAccountStripeId
  }

  async getMTREstimate(stripeAccountId: string) {
    const thirtyDaysAgo = new Date(
      new Date().setDate(new Date().getDate() - 30),
    )
    const result = await this.db
      .select({ sum: sql<number>`sum(amount)` })
      .from(schema.stripeCharges)
      .leftJoin(
        schema.stripeInvoices,
        eq(
          schema.stripeCharges.stripeInvoiceId,
          schema.stripeInvoices.stripeId,
        ),
      )
      .where(
        and(
          eq(schema.stripeCharges.stripeAccountId, stripeAccountId),
          eq(schema.stripeCharges.status, 'succeeded'),
          eq(schema.stripeCharges.mode, 0),
          gte(schema.stripeCharges.stripeCreated, thirtyDaysAgo.toISOString()),
          isNotNull(schema.stripeInvoices.stripeSubscriptionId),
        ),
      )

    if (result.length) {
      return result[0].sum / 100
    }
  }

  getMTR = async (stripeAccountId: string) => {
    const stripeAccount = await this.dbService.getStripeAccount(stripeAccountId)
    if (!stripeAccount) {
      throw new Error(`Stripe account ${stripeAccountId} not found`)
    }

    if (!stripeAccount.billingStripeCustomerId) {
      throw new Error(
        `Stripe account ${stripeAccountId} has no billing customer`,
      )
    }

    const state = await this.entitlementsService.getCustomerState(
      this.billingAccountStripeId,
      stripeAccount.billingStripeCustomerId,
    )

    if (state.subscriptions.length === 0) {
      throw new Error(
        `Stripe account ${stripeAccountId} has no active subscriptions`,
      )
    }

    const subscription = state.subscriptions[0]
    const {
      current_period_start: currentPeriodStart,
      current_period_end: currentPeriodEnd,
    } = subscription

    const agg = await this.db
      .select({ usage: sql<number>`sum(amount)` })
      .from(schema.stripeCharges)
      .leftJoin(
        schema.stripeInvoices,
        eq(
          schema.stripeCharges.stripeInvoiceId,
          schema.stripeInvoices.stripeId,
        ),
      )
      .where(
        and(
          eq(schema.stripeCharges.stripeAccountId, stripeAccount.stripeId),
          eq(schema.stripeCharges.status, 'succeeded'),
          eq(schema.stripeCharges.mode, 0),
          gte(
            schema.stripeCharges.stripeCreated,
            new Date(currentPeriodStart * 1000).toISOString(),
          ),
          lt(
            schema.stripeCharges.stripeCreated,
            new Date(currentPeriodEnd * 1000).toISOString(),
          ),
          isNotNull(schema.stripeInvoices.stripeSubscriptionId),
        ),
      )

    const freeTierFeature = state.features.find((f) => f.id === 'free_tier')
    const freeTierDollars = freeTierFeature ? freeTierFeature.value : FREE_TIER

    const usageCents = parseInt(agg[0].usage.toString() || '0')
    const grossUsageDollars = usageCents / 100
    const netUsageDollars = Math.max(grossUsageDollars - FREE_TIER, 0)
    const mtr = Math.ceil(netUsageDollars / 1000)

    return {
      freeTierDollars,
      grossUsageDollars,
      netUsageDollars,
      mtr,
    }
  }
}
