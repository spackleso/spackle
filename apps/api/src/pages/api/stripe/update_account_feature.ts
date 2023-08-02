import type { NextApiRequest, NextApiResponse } from 'next'
import { verifySignature } from '@/stripe/signature'
import * as Sentry from '@sentry/nextjs'
import { storeAccountStatesAsync } from '@/store/dynamodb'
import db, { features } from 'spackle-db'
import { and, eq } from 'drizzle-orm'

const updateFeature = async (
  account_id: string,
  id: number,
  name: string,
  value_flag: boolean | null,
  value_limit: number | null,
) => {
  await db
    .update(features)
    .set({
      name,
      valueFlag: value_flag,
      valueLimit: value_limit === null ? null : value_limit.toString(),
    })
    .where(and(eq(features.stripeAccountId, account_id), eq(features.id, id)))

  await storeAccountStatesAsync(account_id)
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
