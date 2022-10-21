import type { NextApiRequest, NextApiResponse } from 'next'
import { checkCors } from '../../../cors'
import { getAccountState } from '../../../state'
import { verifySignature } from '../../../stripe/signature'
import { syncStripeAccount } from '../../../stripe/sync'
import { supabase } from '../../../supabase'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  await checkCors(req, res)

  const { success } = verifySignature(req)
  if (!success) {
    return res.status(400).send('')
  }

  // TODO: handle all errors
  const { account_id } = req.body

  await syncStripeAccount(account_id)

  const { data, error } = await supabase
    .from('stripe_accounts')
    .select(
      `
      id,
      initial_sync_complete,
      initial_sync_started_at
    `,
    )
    .eq('stripe_id', account_id)

  res.status(200).json(data ? data[0] : {})
}
