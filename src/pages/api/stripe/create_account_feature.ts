import type { NextApiRequest, NextApiResponse } from 'next'
import { checkCors } from '../../../cors'
import { supabase } from '../../../supabase'
import { syncStripeAccount } from '../../../stripe/sync'
import { verifySignature } from '../../../stripe/signature'
import { withLogging } from '../../../logger'

type Data = {}

const handler = async (req: NextApiRequest, res: NextApiResponse<Data>) => {
  await checkCors(req, res)

  const { success } = verifySignature(req)
  if (!success) {
    return res.status(400).send('')
  }

  // TODO: handle all errors
  const { account_id, name, key, type, value_flag, value_limit } = req.body
  await syncStripeAccount(account_id)

  const { data, error } = await supabase.from('features').insert({
    name,
    key,
    type,
    value_flag,
    value_limit,
    stripe_account_id: account_id,
  })

  res.status(200).json({
    success: true,
  })
}

export default withLogging(handler)
