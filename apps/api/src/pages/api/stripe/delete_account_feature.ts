import type { NextApiRequest, NextApiResponse } from 'next'
import { verifySignature } from '@/stripe/signature'
import * as Sentry from '@sentry/nextjs'
import { storeAccountStatesAsync } from '@/store/dynamodb'
import db, { features } from 'spackle-db'
import { and, eq } from 'drizzle-orm'

type Data = {}

const deleteFeature = async (stripeAccountId: string, featureId: number) => {
  await db
    .delete(features)
    .where(
      and(
        eq(features.stripeAccountId, stripeAccountId),
        eq(features.id, featureId),
      ),
    )
  await storeAccountStatesAsync(stripeAccountId)
}

const handler = async (req: NextApiRequest, res: NextApiResponse<Data>) => {
  const { success } = verifySignature(req)
  if (!success) {
    return res.status(403).json({
      error: 'Unauthorized',
    })
  }

  // TODO: handle all errors
  const { account_id, feature_id } = req.body

  if (feature_id) {
    try {
      await deleteFeature(account_id, feature_id)
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
