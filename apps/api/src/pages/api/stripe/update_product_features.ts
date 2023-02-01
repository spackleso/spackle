import type { NextApiRequest, NextApiResponse } from 'next'
import supabase from 'spackle-supabase'
import { verifySignature } from '@/stripe/signature'
import * as Sentry from '@sentry/nextjs'
import { getOrSyncStripeAccount, getOrSyncStripeProduct } from '@/stripe/sync'
import { storeAccountStatesAsync } from '@/store/dynamodb'

const updateProductFeatures = async (
  account_id: string,
  product_id: string,
  product_features: any[],
) => {
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

  const { error: createError } = await supabase
    .from('product_features')
    .insert(newProductFeatures)

  if (createError) {
    throw new Error(createError.message)
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

  const { error: updateError } = await supabase
    .from('product_features')
    .upsert(updatedProductFeatures)

  if (updateError) {
    throw new Error(updateError.message)
  }

  // Delete
  const { data: all, error: getError } = await supabase
    .from('product_features')
    .select('*')
    .eq('stripe_account_id', account_id)
    .eq('stripe_product_id', product_id)

  if (getError) {
    throw new Error(getError.message)
  }

  const featureIds = product_features.map((pf: any) => pf.feature_id)
  const deleted = all?.filter((pf) => !featureIds.includes(pf.feature_id))
  if (deleted) {
    const { error: deleteError } = await supabase
      .from('product_features')
      .delete()
      .in(
        'id',
        deleted?.map((pf) => pf.id),
      )

    if (deleteError) {
      throw new Error(deleteError.message)
    }
  }

  await storeAccountStatesAsync(account_id)
}

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { success } = verifySignature(req)
  if (!success) {
    return res.status(400).send('')
  }

  const { account_id, product_id, product_features, mode } = req.body
  try {
    await getOrSyncStripeAccount(account_id)
    await getOrSyncStripeProduct(account_id, product_id, mode)
    await updateProductFeatures(account_id, product_id, product_features)
  } catch (error) {
    Sentry.captureException(error)
    return res.status(400).json({
      error: (error as Error).message,
    })
  }

  res.status(200).json({
    success: true,
  })
}

export default handler
