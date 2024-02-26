import { and, eq, gte, isNotNull, sql } from 'drizzle-orm'
import db, { stripeCharges, stripeInvoices, stripeSubscriptions } from '@/db'

export const getMTREstimate = async (stripeAccountId: string) => {
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

  if (result.length) {
    return result[0].sum / 100
  }
}
