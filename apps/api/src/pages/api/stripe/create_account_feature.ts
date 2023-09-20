import type { NextApiRequest, NextApiResponse } from 'next'
import { verifySignature } from '@/stripe/signature'
import * as Sentry from '@sentry/nextjs'
import { storeAccountStatesAsync } from '@/store/dynamodb'
import { upsertStripeUser } from '@/stripe/db'
import { track } from '@/posthog'
import db, { features } from '@/db'

type Data = {
  success?: boolean
  error?: string
}

const createFeature = async (
  stripeAccountId: string,
  name: string,
  key: string,
  type: number,
  valueFlag: boolean | null,
  valueLimit: number | null,
) => {
  const values = {
    stripeAccountId,
    name,
    key,
    type,
    valueFlag,
    valueLimit,
  }
  const result = await db.insert(features).values(values).returning()
  await storeAccountStatesAsync(stripeAccountId)
  return result[0]
}

const handler = async (req: NextApiRequest, res: NextApiResponse<Data>) => {
  const { success } = verifySignature(req)
  if (!success) {
    return res.status(403).json({
      error: 'Unauthorized',
    })
  }

  const {
    account_id,
    name,
    key,
    type,
    value_flag,
    value_limit,
    user_id,
    user_email,
    user_name,
  } = req.body

  try {
    await createFeature(account_id, name, key, type, value_flag, value_limit)
  } catch (error) {
    Sentry.captureException(error)
    return res.status(400).json({
      error: (error as Error).message,
    })
  }

  if (user_id) {
    const user = await upsertStripeUser(
      account_id,
      user_id,
      user_email,
      user_name,
    )

    if (user) {
      await track(user.id.toString(), 'Created feature', {})
    }
  }

  return res.status(201).json({
    success: true,
  })
}

export default handler
