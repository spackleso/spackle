import type { NextApiRequest, NextApiResponse } from 'next'
import { verifySignature } from '@/stripe/signature'
import db, { pricingTables } from 'spackle-db'
import { and, eq } from 'drizzle-orm'

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { success } = verifySignature(req)
  if (!success) {
    return res.status(403).json({
      error: 'Unauthorized',
    })
  }

  const { account_id, mode } = req.body

  const pricingTableResult = await db
    .select({
      id: pricingTables.id,
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
      ),
    )

  let pricingTable
  if (pricingTableResult.length === 0) {
    const createResult = await db
      .insert(pricingTables)
      .values({
        name: 'Default',
        stripeAccountId: account_id,
        mode: mode === 'live' ? 0 : 1,
      })
      .returning({
        id: pricingTables.id,
        name: pricingTables.name,
        mode: pricingTables.mode,
        monthly_enabled: pricingTables.monthlyEnabled,
        annual_enabled: pricingTables.annualEnabled,
      })
    pricingTable = createResult[0]
  } else {
    pricingTable = pricingTableResult[0]
  }

  return res.status(200).json([pricingTable])
}

export default handler
