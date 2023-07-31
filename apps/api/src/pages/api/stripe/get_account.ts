import type { NextApiRequest, NextApiResponse } from 'next'
import { verifySignature } from '@/stripe/signature'
import * as Sentry from '@sentry/nextjs'
import { syncStripeAccount, syncStripeUser } from '@/stripe/sync'
import db, { stripeAccounts } from 'spackle-db'
import { eq } from 'drizzle-orm'

const fetchAccount = async (stripeAccountId: string) => {
  const result = await db
    .select({
      has_acknowledged_setup: stripeAccounts.hasAcknowledgedSetup,
      id: stripeAccounts.id,
      initial_sync_complete: stripeAccounts.initialSyncComplete,
      initial_sync_started_at: stripeAccounts.initialSyncStartedAt,
      stripe_id: stripeAccounts.stripeId,
    })
    .from(stripeAccounts)
    .where(eq(stripeAccounts.stripeId, stripeAccountId))

  return result[0]
}

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === 'HEAD') {
    return res.status(200).end()
  }

  const { success } = verifySignature(req)
  if (!success) {
    return res.status(403).json({
      error: 'Unauthorized',
    })
  }

  // TODO: handle all errors
  const { account_id, account_name, user_email, user_name, user_id } = req.body

  await syncStripeAccount(account_id, account_name)

  let account
  try {
    account = await fetchAccount(account_id)
  } catch (error) {
    Sentry.captureException(error)
    return res.status(400).json({ error })
  }

  if (user_id) {
    try {
      await syncStripeUser(account_id, user_id, user_email, user_name)
    } catch (error) {
      Sentry.captureException(error)
      return res.status(400).json({ error })
    }
  }

  res.status(200).json(account)
}

export default handler
