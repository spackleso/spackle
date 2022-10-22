import type { NextApiRequest, NextApiResponse } from 'next'
import { checkCors } from '../../../cors'
import { supabase } from '../../../supabase'
import { syncStripeAccount, syncStripeProduct } from '../../../stripe/sync'
import { verifySignature } from '../../../stripe/signature'
import { withLogging } from '../../../logger'
import * as Sentry from '@sentry/nextjs'

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  await checkCors(req, res)

  const { success } = verifySignature(req)
  if (!success) {
    return res.status(400).send('')
  }

  // TODO: handle all errors
  const { account_id, product_id, product_features, mode } = req.body

  await syncStripeAccount(account_id)
  await syncStripeProduct(account_id, product_id, mode)

  // Create
  const newProductFeatures = product_features
    .filter((pf: any) => !pf.hasOwnProperty('id'))
    .map((pf: any) => ({
      stripe_account_id: account_id,
      stripe_product_id: product_id,
      feature_id: pf.feature_id,
      value_limit: pf.value_limit,
      value_flag: pf.value_flag,
    }))

  const { error: insertProductFeaturesError } = await supabase
    .from('product_features')
    .insert(newProductFeatures)
  if (insertProductFeaturesError) {
    Sentry.captureException(insertProductFeaturesError)
  }

  // Update
  const updatedProductFeatures = product_features
    .filter((pf: any) => pf.hasOwnProperty('id'))
    .map((pf: any) => ({
      feature_id: pf.feature_id,
      id: pf.id,
      stripe_account_id: account_id,
      stripe_product_id: product_id,
      value_flag: pf.value_flag,
      value_limit: pf.value_limit,
    }))

  const { error: upsertProductFeaturesError } = await supabase
    .from('product_features')
    .upsert(updatedProductFeatures)

  if (upsertProductFeaturesError) {
    Sentry.captureException(upsertProductFeaturesError)
  }

  // Delete
  const { data: all } = await supabase
    .from('product_features')
    .select('*')
    .eq('stripe_account_id', account_id)
    .eq('stripe_product_id', product_id)

  const featureIds = product_features.map((pf: any) => pf.feature_id)
  const deleted = all?.filter((pf) => !featureIds.includes(pf.feature_id))
  if (deleted) {
    await supabase
      .from('product_features')
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
