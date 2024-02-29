import { and, eq, gte, isNotNull, lt, sql, sum } from 'drizzle-orm'
import db, { stripeCharges, stripeInvoices, stripeSubscriptions } from '@/db'
import { getStripeAccount } from './stripe/db'
import { getCustomerState } from './state'

const BILLING_ACCOUNT = process.env.STRIPE_ACCOUNT_ID || ''
const FREE_TIER = 1000

export const getMTREstimate = async (stripeAccountId: string) => {
  const thirtyDaysAgo = new Date(new Date().setDate(new Date().getDate() - 30))
  const result = await db
    .select({ sum: sql<number>`sum(amount)` })
    .from(stripeCharges)
    .leftJoin(
      stripeInvoices,
      eq(stripeCharges.stripeInvoiceId, stripeInvoices.stripeId),
    )
    .where(
      and(
        eq(stripeCharges.stripeAccountId, stripeAccountId),
        eq(stripeCharges.status, 'succeeded'),
        eq(stripeCharges.mode, 0),
        gte(stripeCharges.stripeCreated, thirtyDaysAgo.toISOString()),
        isNotNull(stripeInvoices.stripeSubscriptionId),
      ),
    )

  if (result.length) {
    return result[0].sum / 100
  }
}

export const getMTR = async (stripeAccountId: string) => {
  const stripeAccount = await getStripeAccount(stripeAccountId)
  if (!stripeAccount) {
    throw new Error(`Stripe account ${stripeAccountId} not found`)
  }

  if (!stripeAccount.billingStripeCustomerId) {
    throw new Error(`Stripe account ${stripeAccountId} has no billing customer`)
  }

  const state = await getCustomerState(
    BILLING_ACCOUNT,
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

  const agg = await db
    .select({ usage: sum(stripeCharges.amount) })
    .from(stripeCharges)
    .leftJoin(
      stripeInvoices,
      eq(stripeCharges.stripeInvoiceId, stripeInvoices.stripeId),
    )
    .where(
      and(
        eq(stripeCharges.stripeAccountId, stripeAccount.stripeId),
        eq(stripeCharges.status, 'succeeded'),
        eq(stripeCharges.mode, 0),
        gte(
          stripeCharges.stripeCreated,
          new Date(currentPeriodStart * 1000).toISOString(),
        ),
        lt(
          stripeCharges.stripeCreated,
          new Date(currentPeriodEnd * 1000).toISOString(),
        ),
        isNotNull(stripeInvoices.stripeSubscriptionId),
      ),
    )

  const freeTierFeature = state.features.find((f) => f.id === 'free_tier')
  const freeTierDollars = freeTierFeature ? freeTierFeature.value : FREE_TIER

  const usageCents = parseInt(agg[0].usage || '0')
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
