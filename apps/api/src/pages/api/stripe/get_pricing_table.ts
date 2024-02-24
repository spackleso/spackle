import type { NextApiRequest, NextApiResponse } from 'next'
import { verifySignature } from '@/stripe/signature'
import db, { pricingTables, encodePk, decodePk } from '@/db'
import { and, eq } from 'drizzle-orm'

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { success } = verifySignature(req)
  if (!success) {
    return res.status(403).json({
      error: 'Unauthorized',
    })
  }

  const { account_id, mode, pricing_table_id } = req.body

  if (!pricing_table_id) {
    return res.status(404).send('')
  }

  const pricingTableResult = await db
    .select({
      id: encodePk(pricingTables.id),
      name: pricingTables.name,
      mode: pricingTables.mode,
      monthly_enabled: pricingTables.monthlyEnabled,
      annual_enabled: pricingTables.annualEnabled,
    })
    .from(pricingTables)
    .where(
      and(
        eq(pricingTables.stripeAccountId, account_id),
        eq(pricingTables.mode, mode === 'live' ? 0 : 1),
        decodePk(pricingTables.id, pricing_table_id),
      ),
    )

  if (pricingTableResult.length === 0) {
    return res.status(404).send('')
  } else {
    let pricingTable = pricingTableResult[0]
    return res.status(200).json(pricingTable)
  }
}

export default handler