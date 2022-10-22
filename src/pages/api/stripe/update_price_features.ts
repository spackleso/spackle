import type { NextApiRequest, NextApiResponse } from 'next'
import { checkCors } from '../../../cors'
import { supabase } from '../../../supabase'
import { syncStripeAccount, syncStripePrice } from '../../../stripe/sync'
import { verifySignature } from '../../../stripe/signature'
import { withLogging } from '../../../logger'

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  await checkCors(req, res)

  const { success } = verifySignature(req)
  if (!success) {
    return res.status(400).send('')
  }
  // TODO: handle all errors
  const { account_id, price_id, price_features, mode } = req.body

  await syncStripeAccount(account_id)
  await syncStripePrice(account_id, price_id, mode)

  // Create
  const newPriceFeatures = price_features
    .filter((pf: any) => !pf.hasOwnProperty('id'))
    .map((pf: any) => ({
      stripe_account_id: account_id,
      stripe_price_id: price_id,
      feature_id: pf.feature_id,
      value_limit: pf.value_limit,
      value_flag: pf.value_flag,
    }))

  const { data, error } = await supabase
    .from('price_features')
    .insert(newPriceFeatures)

  // Update
  const updatedPriceFeatures = price_features
    .filter((pf: any) => pf.hasOwnProperty('id'))
    .map((pf: any) => ({
      feature_id: pf.feature_id,
      id: pf.id,
      stripe_account_id: account_id,
      stripe_price_id: price_id,
      value_flag: pf.value_flag,
      value_limit: pf.value_limit,
    }))

  await supabase.from('price_features').upsert(updatedPriceFeatures)

  // Delete
  const { data: all } = await supabase
    .from('price_features')
    .select('*')
    .eq('stripe_account_id', account_id)
    .eq('stripe_price_id', price_id)

  const featureIds = price_features.map((pf: any) => pf.feature_id)
  const deleted = all?.filter((pf) => !featureIds.includes(pf.feature_id))
  if (deleted) {
    await supabase
      .from('price_features')
      .delete()
      .in(
        'id',
        deleted?.map((pf) => pf.id),
      )
  }

  res.status(200).json({
    success: true,
  })
}

export default withLogging(handler)
