import type { NextApiRequest, NextApiResponse } from 'next'
import { verifySignature } from '@/stripe/signature'
import * as Sentry from '@sentry/nextjs'
import { syncStripeAccount, syncStripeUser } from '@/stripe/sync'
import db, { stripeAccounts } from 'spackle-db'
import { eq } from 'drizzle-orm'

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

  const { account_id, account_name, user_email, user_name, user_id } = req.body

  const account = await syncStripeAccount(account_id, account_name)
  if (user_id) {
    try {
      await syncStripeUser(account_id, user_id, user_email, user_name)
    } catch (error) {
      Sentry.captureException(error)
      return res.status(400).json({ error })
    }
  }

  res.status(200).json({
    has_acknowledged_setup: account.hasAcknowledgedSetup,
    id: account.id,
    initial_sync_complete: account.initialSyncComplete,
    initial_sync_started_at: account.initialSyncStartedAt,
    stripe_id: account.stripeId,
  })
}

export default handler
