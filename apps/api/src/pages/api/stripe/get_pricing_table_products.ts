import type { NextApiRequest, NextApiResponse } from 'next'
import { verifySignature } from '@/stripe/signature'
import db, { pricingTableProducts } from 'spackle-db'
import { and, eq } from 'drizzle-orm'

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { success } = verifySignature(req)
  if (!success) {
    return res.status(403).json({
      error: 'Unauthorized',
    })
  }

  const { account_id, pricing_table_id } = req.body
  const pricingTableResult = await db
    .select({
      id: pricingTableProducts.id,
    })
    .from(pricingTableProducts)
    .where(
      and(
        eq(pricingTableProducts.stripeAccountId, account_id),
        eq(pricingTableProducts.pricingTableId, pricing_table_id),
      ),
    )

  return res.status(200).json(pricingTableResult)
}

export default handler
