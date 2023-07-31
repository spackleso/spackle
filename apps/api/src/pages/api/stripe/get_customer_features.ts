import type { NextApiRequest, NextApiResponse } from 'next'
import { verifySignature } from '@/stripe/signature'
import { getOrSyncStripeCustomer } from '@/stripe/sync'
import db, { customerFeatures, features } from 'spackle-db'
import { and, eq } from 'drizzle-orm'

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { success } = verifySignature(req)
  if (!success) {
    return res.status(403).json({
      error: 'Unauthorized',
    })
  }

  const { account_id, customer_id, mode } = req.body

  await getOrSyncStripeCustomer(account_id, customer_id, mode)

  const data = await db
    .select({
      id: customerFeatures.id,
      feature_id: customerFeatures.featureId,
      value_flag: customerFeatures.valueFlag,
      value_limit: customerFeatures.valueLimit,
      name: features.name,
    })
    .from(customerFeatures)
    .leftJoin(features, eq(customerFeatures.featureId, features.id))
    .where(
      and(
        eq(customerFeatures.stripeAccountId, account_id),
        eq(customerFeatures.stripeCustomerId, customer_id),
      ),
    )
    .orderBy(features.name)

  res.status(200).json({ data })
}

export default handler
