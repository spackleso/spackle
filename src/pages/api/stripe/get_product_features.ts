import type { NextApiRequest, NextApiResponse } from 'next'
import { checkCors } from '../../../cors'
import { supabase } from '../../../supabase'
import { syncStripeAccount, syncStripeProduct } from '../../../stripe/sync'
import { verifySignature } from '../../../stripe/signature'
import { withLogging } from '../../../logger'

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  await checkCors(req, res)

  const { success } = verifySignature(req)
  if (!success) {
    return res.status(400).send('')
  }

  const { account_id, product_id, mode } = req.body

  await syncStripeAccount(account_id)
  await syncStripeProduct(account_id, product_id, mode)

  const { data, error } = await supabase
    .from('product_features')
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
    .eq('stripe_product_id', product_id)
    .order('name', { foreignTable: 'features', ascending: true })

  // TODO: pop features key before serialization
  res.status(200).json({
    data: data || [],
  })
}

export default withLogging(handler)
