import type { NextApiRequest, NextApiResponse } from 'next'
import { verifySignature } from '@/stripe/signature'
import supabase, { SupabaseError } from 'spackle-supabase'
import * as Sentry from '@sentry/nextjs'
import { syncStripeAccount, syncStripeUser } from '@/stripe/sync'

const fetchAccount = async (accountId: string) => {
  const { data, error } = await supabase
    .from('stripe_accounts')
    .select(
      `
        has_acknowledged_setup,
        id,
        initial_sync_complete,
        initial_sync_started_at,
        invite_id,
        stripe_id
      `,
    )
    .eq('stripe_id', accountId)
    .limit(1)

  if (error) throw new SupabaseError(error)
  return data
}

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { success } = verifySignature(req)
  if (!success) {
    return res.status(400).send('')
  }

  // TODO: handle all errors
  const { account_id, account_name, user_email, user_name, user_id } = req.body

  await syncStripeAccount(account_id, account_name)

  let data
  try {
    data = await fetchAccount(account_id)
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

  res.status(200).json(data.length ? data[0] : {})
}

export default handler
