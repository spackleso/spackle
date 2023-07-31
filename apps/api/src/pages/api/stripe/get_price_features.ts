import type { NextApiRequest, NextApiResponse } from 'next'
import { verifySignature } from '@/stripe/signature'
import * as Sentry from '@sentry/nextjs'
import db, { features, priceFeatures } from 'spackle-db'
import { and, eq } from 'drizzle-orm'

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { success } = verifySignature(req)
  if (!success) {
    return res.status(403).json({
      error: 'Unauthorized',
    })
  }

  const { account_id, price_id, mode } = req.body

  const data = await db
    .select({
      id: priceFeatures.id,
      feature_id: priceFeatures.featureId,
      value_flag: priceFeatures.valueFlag,
      value_limit: priceFeatures.valueLimit,
      name: features.name,
    })
    .from(priceFeatures)
    .leftJoin(features, eq(priceFeatures.featureId, features.id))
    .where(
      and(
        eq(priceFeatures.stripeAccountId, account_id),
        eq(priceFeatures.stripePriceId, price_id),
      ),
    )
    .orderBy(features.name)

  res.status(200).json({ data })
}

export default handler
