import type { NextApiRequest, NextApiResponse } from 'next'
import { verifySignature } from '@/stripe/signature'
import * as Sentry from '@sentry/nextjs'
import db, { stripeAccounts } from '@/db'
import { eq } from 'drizzle-orm'

const acknowledgeSetup = async (stripeAccountId: string) => {
  await db
    .update(stripeAccounts)
    .set({
      hasAcknowledgedSetup: true,
    })
    .where(eq(stripeAccounts.stripeId, stripeAccountId))
}

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { success } = verifySignature(req)
  if (!success) {
    return res.status(403).json({ error: 'Unauthorized' })
  }

  const { account_id } = req.body

  try {
    await acknowledgeSetup(account_id)
  } catch (error) {
    console.log(error)
    Sentry.captureException(error)
    return res.status(400).json({ error })
  }

  res.status(200).json({
    success: true,
  })
}

export default handler
