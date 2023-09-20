import type { NextApiRequest, NextApiResponse } from 'next'
import { verifySignature } from '@/stripe/signature'
import * as Sentry from '@sentry/nextjs'
import { storeAccountStatesAsync } from '@/store/dynamodb'
import db, { features } from '@/db'
import { and, eq } from 'drizzle-orm'

const updateFeature = async (
  stripeAccountId: string,
  id: number,
  name: string,
  valueFlag: boolean | null,
  valueLimit: number | null,
) => {
  await db
    .update(features)
    .set({
      name,
      valueFlag,
      valueLimit,
    })
    .where(
      and(eq(features.stripeAccountId, stripeAccountId), eq(features.id, id)),
    )

  await storeAccountStatesAsync(stripeAccountId)
}

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { success } = verifySignature(req)
  if (!success) {
    return res.status(403).json({
      error: 'Unauthorized',
    })
  }

  const { account_id, id, name, value_flag, value_limit } = req.body
  try {
    await updateFeature(account_id, id, name, value_flag, value_limit)
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
