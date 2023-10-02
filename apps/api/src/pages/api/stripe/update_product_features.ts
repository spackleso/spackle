import type { NextApiRequest, NextApiResponse } from 'next'
import { verifySignature } from '@/stripe/signature'
import * as Sentry from '@sentry/nextjs'
import { getOrSyncStripeAccount, getOrSyncStripeProduct } from '@/stripe/sync'
import { storeAccountStatesAsync } from '@/store/dynamodb'
import db, { productFeatures } from '@/db'
import { and, eq, inArray } from 'drizzle-orm'

const updateProductFeatures = async (
  stripeAccountId: string,
  stripeProductId: string,
  data: any[],
) => {
  await db.transaction(async (trx) => {
    // Update
    const updatedProductFeatures = data
      .filter((pf: any) => pf.hasOwnProperty('id'))
      .map((pf: any) => ({
        featureId: pf.feature_id,
        id: pf.id,
        stripeAccountId,
        stripeProductId,
        valueFlag: pf.value_flag,
        valueLimit: pf.value_limit,
      }))

    for (const pf of updatedProductFeatures) {
      await trx
        .update(productFeatures)
        .set(pf)
        .where(
          and(
            eq(productFeatures.stripeAccountId, pf.stripeAccountId),
            eq(productFeatures.id, pf.id),
          ),
        )
    }

    // Create
    const newProductFeatures = data
      .filter((pf: any) => !pf.hasOwnProperty('id'))
      .map((pf: any) => ({
        stripeAccountId,
        stripeProductId,
        featureId: pf.feature_id,
        valueLimit: pf.value_limit,
        valueFlag: pf.value_flag,
      }))

    if (newProductFeatures.length) {
      await trx.insert(productFeatures).values(newProductFeatures)
    }

    // Delete
    const result = await trx
      .select()
      .from(productFeatures)
      .where(
        and(
          eq(productFeatures.stripeAccountId, stripeAccountId),
          eq(productFeatures.stripeProductId, stripeProductId),
        ),
      )

    const featureIds = data.map((pf: any) => pf.feature_id)
    const deleted = result.filter((pf) => !featureIds.includes(pf.featureId))
    if (deleted.length) {
      await trx.delete(productFeatures).where(
        inArray(
          productFeatures.id,
          deleted.map((pf) => pf.id),
        ),
      )
    }
  })

  await storeAccountStatesAsync(stripeAccountId)
}

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { success } = verifySignature(req)
  if (!success) {
    return res.status(403).json({
      error: 'Unauthorized',
    })
  }

  const { account_id, product_id, product_features, mode } = req.body
  try {
    await getOrSyncStripeAccount(account_id)
    await getOrSyncStripeProduct(account_id, product_id, mode)
    await updateProductFeatures(account_id, product_id, product_features)
  } catch (error) {
    Sentry.captureException(error)
    return res.status(400).json({
      error: (error as Error).message,
    })
  }

  res.status(200).json({
    success: true,
  })
}

export default handler
