import type { NextApiRequest, NextApiResponse } from 'next'
import { verifySignature } from '@/stripe/signature'
import db, { features, productFeatures } from 'spackle-db'
import { and, eq } from 'drizzle-orm'

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { success } = verifySignature(req)
  if (!success) {
    return res.status(403).json({
      error: 'Unauthorized',
    })
  }

  const { account_id, product_id } = req.body
  const data = await db
    .select({
      id: productFeatures.id,
      feature_id: productFeatures.featureId,
      value_flag: productFeatures.valueFlag,
      value_limit: productFeatures.valueLimit,
      name: features.name,
    })
    .from(productFeatures)
    .leftJoin(features, eq(productFeatures.featureId, features.id))
    .where(
      and(
        eq(productFeatures.stripeAccountId, account_id),
        eq(productFeatures.stripeProductId, product_id),
      ),
    )
    .orderBy(features.name)

  res.status(200).json({ data })
}

export default handler
