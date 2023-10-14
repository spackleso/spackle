import db, { stripeCharges, stripeInvoices, stripeSubscriptions } from '@/db'
import { verifySignature } from '@/stripe/signature'
import { NextApiRequest, NextApiResponse } from 'next'
import { and, eq, gt, gte, isNotNull, sql } from 'drizzle-orm'

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { success } = verifySignature(req)
  if (!success) {
    return res.status(403).json({
      error: 'Unauthorized',
    })
  }

  const { account_id } = req.body
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
        eq(stripeCharges.stripeAccountId, account_id),
        eq(stripeCharges.status, 'succeeded'),
        eq(stripeCharges.mode, 0),
        gte(stripeCharges.stripeCreated, thirtyDaysAgo.toISOString()),
        isNotNull(stripeSubscriptions.stripeId),
      ),
    )

  if (result.length === 0) {
    return res.status(200).json({ mtr: 0 })
  } else {
    return res.status(200).json({ mtr: result[0].sum / 100 })
  }
}

export default handler
