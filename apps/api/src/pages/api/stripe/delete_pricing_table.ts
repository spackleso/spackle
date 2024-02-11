import type { NextApiRequest, NextApiResponse } from 'next'
import { verifySignature } from '@/stripe/signature'
import * as Sentry from '@sentry/nextjs'
import db, { decodePk, pricingTables } from '@/db'
import { and, eq } from 'drizzle-orm'

const deletePricingTable = async (
  stripeAccountId: string,
  pricingTableId: string,
) => {
  await db
    .delete(pricingTables)
    .where(
      and(
        eq(pricingTables.stripeAccountId, stripeAccountId),
        decodePk(pricingTables.id, pricingTableId),
      ),
    )
}

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { success } = verifySignature(req)
  if (!success) {
    return res.status(403).json({
      error: 'Unauthorized',
    })
  }

  const { account_id, id } = req.body

  if (id) {
    try {
      await deletePricingTable(account_id, id)
    } catch (error) {
      Sentry.captureException(error)
      return res.status(400).json({
        error: (error as Error).message,
      })
    }
  }

  res.status(200).json({
    success: true,
  })
}

export default handler
