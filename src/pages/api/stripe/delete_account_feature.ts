import type { NextApiRequest, NextApiResponse } from 'next'
import { checkCors } from '../../../cors'
import { supabase } from '../../../supabase'
import { syncStripeAccount } from '../../../stripe/sync'
import { verifySignature } from '../../../stripe/signature'

type Data = {}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>,
) {
  await checkCors(req, res)

  const { success } = verifySignature(req)
  if (!success) {
    return res.status(400).send('')
  }

  // TODO: handle all errors
  const { account_id, feature_id } = req.body
  await syncStripeAccount(account_id)

  if (feature_id) {
    const { data, error } = await supabase
      .from('features')
      .delete()
      .eq('stripe_account_id', account_id)
      .eq('id', feature_id)
  }

  res.status(200).json({
    success: true,
  })
}
