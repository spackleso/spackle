import {
  db,
  stripeAccounts,
  stripeCharges,
  stripeInvoices,
  stripeSubscriptions,
} from '@/db'
import { and, eq, gte, isNotNull, lt, sql } from 'drizzle-orm'

/*
 * Returns the stripe_account based on billingStripeCustomerId.
 */
export const getStripeAccountByBillingId = async (
  billingStripeCustomerId: string,
) => {
  const result = await db
    .select()
    .from(stripeAccounts)
    .where(eq(stripeAccounts.billingStripeCustomerId, billingStripeCustomerId))

  if (result.length) {
    return result[0]
  }

  return null
}

/*
 * This function returns the MTR for the customer within the last 30 days. This
 * is used on the paywall to show the prospect an estimate.
 */
export const getMTREstimate = async (
  stripeAccountId: string,
): Promise<number> => {
  const thirtyDaysAgo = new Date(new Date().setDate(new Date().getDate() - 30))
  const result = await db
    .select({ sum: sql<number>`sum(amount)` })
    .from(stripeCharges)
    .leftJoin(
      stripeInvoices,
      eq(stripeCharges.stripeInvoiceId, stripeInvoices.stripeId),
    )
    .leftJoin(
      stripeSubscriptions,
      eq(stripeInvoices.stripeSubscriptionId, stripeSubscriptions.stripeId),
    )
    .where(
      and(
        eq(stripeCharges.stripeAccountId, stripeAccountId),
        eq(stripeCharges.status, 'succeeded'),
        eq(stripeCharges.mode, 0),
        gte(stripeCharges.stripeCreated, thirtyDaysAgo.toISOString()),
        isNotNull(stripeSubscriptions.stripeId),
      ),
    )

  if (result.length === 0) {
    return 0
  }

  return result[0].sum / 100
}

/*
 * This function returns the MTR for the customer within the current billing
 * period based on their current active subscription.
 */
export const getCurrentPeriodMTR = async (
  stripeAccountId: string,
): Promise<number> => {}

/*
 * This function returns the usage for the current billing period.  Usage is
 * defined as the quantity of $1,000 MTR used.
 * Example:
 *  If a customer has processed $10,000 worth of charges,
 *  usage would be 9 (assuming 1,000 MTR is free):
 *    (10,000 - 1,000) / 1,000 = 9
 */
export const getCurrentPeriodUsage = async (
  stripeAccountId: string,
): Promise<number> => {}
