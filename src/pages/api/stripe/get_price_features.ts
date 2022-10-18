import type { NextApiRequest, NextApiResponse } from 'next'
import { checkCors } from '../../../cors'
import { syncStripeAccount, syncStripePrice } from '../../../stripe/sync'
import { supabase } from '../../../supabase'
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

  const { account_id, price_id, mode } = req.body

  await syncStripeAccount(account_id)
  await syncStripePrice(account_id, price_id, mode)

  const { data, error } = await supabase
    .from('price_features')
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
    .eq('stripe_price_id', price_id)
    .order('name', { foreignTable: 'features', ascending: true })

  res.status(200).json({
    data: data || [],
  })
}
