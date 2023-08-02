import type { NextApiRequest, NextApiResponse } from 'next'
import { verifySignature } from '@/stripe/signature'
import * as Sentry from '@sentry/nextjs'
import { getOrSyncStripeAccount, getOrSyncStripePrice } from '@/stripe/sync'
import { storeAccountStatesAsync } from '@/store/dynamodb'
import db, { priceFeatures } from 'spackle-db'
import { and, eq, inArray } from 'drizzle-orm'

const updatePriceFeatures = async (
  stripeAccountId: string,
  stripePriceId: string,
  data: any[],
) => {
  // Create
  const newPriceFeatures = data
    .filter((pf: any) => !pf.hasOwnProperty('id'))
    .map((pf: any) => ({
      stripeAccountId,
      stripePriceId,
      featureId: pf.feature_id,
      valueLimit: pf.value_limit,
      valueFlag: pf.value_flag,
    }))

  if (newPriceFeatures.length > 0) {
    await db.insert(priceFeatures).values(newPriceFeatures)
  }

  // Update
  const updatedPriceFeatures = data
    .filter((pf: any) => pf.hasOwnProperty('id'))
    .map((pf: any) => ({
      featureId: pf.feature_id,
      id: pf.id,
      stripeAccountId,
      stripePriceId,
      valueFlag: pf.value_flag,
      valueLimit: pf.value_limit,
    }))

  for (const pf of updatedPriceFeatures) {
    await db
      .update(priceFeatures)
      .set(pf)
      .where(
        and(
          eq(priceFeatures.stripeAccountId, pf.stripeAccountId),
          eq(priceFeatures.id, pf.id),
        ),
      )
  }

  // Delete
  const result = await db
    .select()
    .from(priceFeatures)
    .where(
      and(
        eq(priceFeatures.stripeAccountId, stripeAccountId),
        eq(priceFeatures.stripePriceId, stripePriceId),
      ),
    )

  const featureIds = data.map((pf: any) => pf.feature_id)
  const deleted = result.filter((pf) => !featureIds.includes(pf.featureId))
  if (deleted.length) {
    await db.delete(priceFeatures).where(
      inArray(
        priceFeatures.id,
        deleted.map((pf) => pf.id),
      ),
    )
  }

  await storeAccountStatesAsync(stripeAccountId)
}

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { success } = verifySignature(req)
  if (!success) {
    return res.status(403).json({
      error: 'Unauthorized',
    })
  }
  // TODO: handle all errors
  const { account_id, price_id, price_features, mode } = req.body
  try {
    await getOrSyncStripeAccount(account_id)
    await getOrSyncStripePrice(account_id, price_id, mode)
    await updatePriceFeatures(account_id, price_id, price_features)
  } catch (error) {
    Sentry.captureException(error)
    res.status(400).json({
      error: (error as Error).message,
    })
    return
  }

  res.status(200).json({
    success: true,
  })
}

export default handler
