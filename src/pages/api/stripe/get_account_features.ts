import type { NextApiRequest, NextApiResponse } from 'next'
import { checkCors } from '../../../cors'
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
    .from('features')
    .select('id,name,key,type,value_flag,value_limit')
    .eq('stripe_account_id', account_id)
    .order('name', { ascending: true })

  res.status(200).json({
    data: data || [],
  })
}
