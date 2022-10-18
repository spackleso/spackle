import type { NextApiRequest, NextApiResponse } from 'next'
import { checkCors } from '../../../cors'
import { supabase } from '../../../supabase'
import { syncStripeAccount, syncStripeCustomer } from '../../../stripe/sync'
import { verifySignature } from '../../../stripe/signature'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  await checkCors(req, res)

  const { success } = verifySignature(req)
  if (!success) {
    return res.status(400).send('')
  }

  const { account_id, customer_id, mode } = req.body

  await syncStripeAccount(account_id)
  await syncStripeCustomer(account_id, customer_id, mode)

  const { data, error } = await supabase
    .from('customer_features')
    .select(
      `
        id,
        feature_id,
        value_flag,
        value_limit,
        features(name)
      `,
    )
    .eq('stripe_account_id', account_id)
    .eq('stripe_customer_id', customer_id)
    .order('name', { foreignTable: 'features', ascending: true })

  res.status(200).json({
    data: data || [],
  })
}
