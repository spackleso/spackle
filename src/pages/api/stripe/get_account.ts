import type { NextApiRequest, NextApiResponse } from 'next'
import { checkCors } from '../../../cors'
import { withLogging } from '../../../logger'
import { verifySignature } from '../../../stripe/signature'
import { supabase } from '../../../supabase'
import * as Sentry from '@sentry/nextjs'
import { syncStripeAccount } from '@/stripe/sync'

const fetchAccount = async (accountId: string) => {
  let response = await supabase
    .from('stripe_accounts')
    .select(
      `
        id,
        stripe_id,
        initial_sync_complete,
        initial_sync_started_at,
        invite_id,
        wait_list_entries(id)
      `,
    )
    .eq('stripe_id', accountId)
    .limit(1)
    .single()

  if (response.error) {
    throw new Error(response.error.message)
  }

  return response
}

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  await checkCors(req, res)

  const { success } = verifySignature(req)
  if (!success) {
    return res.status(400).send('')
  }

  // TODO: handle all errors
  const { account_id } = req.body

  let data
  try {
    ;({ data } = await fetchAccount(account_id))
  } catch (error) {
    Sentry.captureException(error)
    return res.status(400).json({ error })
  }

  // In this case, go ahead and create the account if it doesn't exist
  if (!data) {
    ;({ data } = await syncStripeAccount(account_id))

    try {
      ;({ data } = await fetchAccount(account_id))
    } catch (error) {
      Sentry.captureException(error)
      return res.status(400).json({ error })
    }
  }

  res.status(200).json(data || {})
}

export default withLogging(handler)
