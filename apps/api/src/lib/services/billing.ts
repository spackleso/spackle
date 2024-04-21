import {
  Database,
  and,
  count,
  eq,
  gte,
  isNotNull,
  lt,
  schema,
  sql,
} from '@spackle/db'
import { DatabaseService } from '@/lib/services/db'
import { EntitlementsService } from '@/lib/services/entitlements'
import { AnalyticsService } from '@/lib/services/analytics'

export const FREE_TIER = 1000

export class BillingService {
  private readonly db: Database
  private readonly dbService: DatabaseService
  private readonly entitlementsService: EntitlementsService
  private readonly billingAccountStripeId: string
  private readonly environment: string
  private readonly analyticsService: AnalyticsService

  constructor(
    db: Database,
    dbService: DatabaseService,
    entitlementsService: EntitlementsService,
    billingAccountStripeId: string,
    environment: string,
    analyticsService: AnalyticsService,
  ) {
    this.db = db
    this.dbService = dbService
    this.entitlementsService = entitlementsService
    this.billingAccountStripeId = billingAccountStripeId
    this.environment = environment
    this.analyticsService = analyticsService
  }

  async getUsage(stripeAccountId: string) {
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

    const features = await this.db
      .select({ value: count() })
      .from(schema.features)
      .where(eq(schema.features.stripeAccountId, stripeAccountId))

    const pricingTables = await this.db
      .select({ value: count() })
      .from(schema.pricingTables)
      .where(eq(schema.pricingTables.stripeAccountId, stripeAccountId))

    const users = await this.db
      .select({ value: count() })
      .from(schema.stripeUsers)
      .where(eq(schema.stripeUsers.stripeAccountId, stripeAccountId))

    const subscription = state.subscriptions[0]
    const {
      current_period_start: currentPeriodStart,
      current_period_end: currentPeriodEnd,
    } = subscription

    const query = `
      SELECT
        count()
      FROM
        'entitlement-checks-${this.environment}'
      WHERE
        index1 = '${stripeAccountId}'
        AND timestamp > toDateTime(${currentPeriodStart})
        AND timestamp < toDateTime(${currentPeriodEnd});
    `

    const entitlementChecks = await this.analyticsService.query(query)

    return {
      numFeatures: features[0].value,
      numEntitlementChecks:
        entitlementChecks.length > 0
          ? parseInt(entitlementChecks[0]['count()'])
          : 0,
      numPricingTables: pricingTables[0].value,
      numUsers: users[0].value,
    }
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

  async getMTR(stripeAccountId: string) {
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

    const usageCents = parseInt((agg[0].usage || 0).toString())
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
