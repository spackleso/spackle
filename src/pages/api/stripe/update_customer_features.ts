import type { NextApiRequest, NextApiResponse } from 'next'
import { checkCors } from '../../../cors'
import { supabase } from '../../../supabase'
import { syncStripeAccount, syncStripeCustomer } from '../../../stripe/sync'
import { verifySignature } from '../../../stripe/signature'
import { withLogging } from '../../../logger'
import * as Sentry from '@sentry/nextjs'
import { invalidateCustomerState } from '../../../cache'

const updateCustomerFeatures = async (
  account_id: string,
  customer_id: string,
  customer_features: any[],
) => {
  // Create new features
  const newCustomerFeatures = customer_features
    .filter((pf: any) => !pf.hasOwnProperty('id'))
    .map((pf: any) => ({
      stripe_account_id: account_id,
      stripe_customer_id: customer_id,
      feature_id: pf.feature_id,
      value_limit: pf.value_limit,
      value_flag: pf.value_flag,
    }))

  const { error: createError } = await supabase
    .from('customer_features')
    .insert(newCustomerFeatures)

  if (createError) {
    throw new Error(createError.message)
  }

  // Update
  const updatedCustomerFeatures = customer_features
    .filter((pf: any) => pf.hasOwnProperty('id'))
    .map((pf: any) => ({
      feature_id: pf.feature_id,
      id: pf.id,
      stripe_account_id: account_id,
      stripe_customer_id: customer_id,
      value_flag: pf.value_flag,
      value_limit: pf.value_limit,
    }))

  const { error: updateError } = await supabase
    .from('customer_features')
    .upsert(updatedCustomerFeatures)

  if (updateError) {
    throw new Error(updateError.message)
  }

  // Delete
  const { data: all, error: getError } = await supabase
    .from('customer_features')
    .select('*')
    .eq('stripe_account_id', account_id)
    .eq('stripe_customer_id', customer_id)

  if (getError) {
    throw new Error(getError.message)
  }

  const featureIds = customer_features.map((pf: any) => pf.feature_id)
  const deleted = all?.filter((pf) => !featureIds.includes(pf.feature_id))
  if (deleted) {
    const { error: deleteError } = await supabase
      .from('customer_features')
      .delete()
      .in(
        'id',
        deleted?.map((pf) => pf.id),
      )

    if (deleteError) {
      throw new Error(deleteError.message)
    }
  }

  await invalidateCustomerState(account_id, customer_id)
}

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  await checkCors(req, res)

  const { success } = verifySignature(req)
  if (!success) {
    return res.status(400).send('')
  }
  // TODO: handle all errors
  const { account_id, customer_id, customer_features, mode } = req.body

  try {
    await updateCustomerFeatures(account_id, customer_id, customer_features)
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

export default withLogging(handler)
