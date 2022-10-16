import type { NextApiRequest, NextApiResponse } from 'next'
import stripe from '../../../stripe'
import { checkCors } from '../../../cors'
import { supabase } from '../../../supabase'
import { syncStripeAccount, syncStripeCustomer } from '../../../stripe/sync'

type Data = {}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>,
) {
  await checkCors(req, res)

  const sig = req.headers['stripe-signature'] as string
  const payload = JSON.stringify(req.body)

  try {
    stripe.webhooks.signature.verifyHeader(
      payload,
      sig,
      process.env.STRIPE_SIGNING_SECRET as string,
    )
  } catch (error: any) {
    res.status(400).send(error.message)
    return
  }

  // TODO: handle all errors
  const { account_id, customer_id, customer_features } = req.body

  await syncStripeAccount(account_id)
  await syncStripeCustomer(account_id, customer_id)

  // Create
  const newCustomerFeatures = customer_features
    .filter((pf: any) => !pf.hasOwnProperty('id'))
    .map((pf: any) => ({
      stripe_account_id: account_id,
      stripe_customer_id: customer_id,
      feature_id: pf.feature_id,
      value_limit: pf.value_limit,
      value_flag: pf.value_flag,
    }))

  const { data, error } = await supabase
    .from('customer_features')
    .insert(newCustomerFeatures)
  console.log(error)

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

  await supabase.from('customer_features').upsert(updatedCustomerFeatures)

  // Delete
  const { data: all } = await supabase
    .from('customer_features')
    .select('*')
    .eq('stripe_account_id', account_id)
    .eq('stripe_customer_id', customer_id)

  const featureIds = customer_features.map((pf: any) => pf.feature_id)
  const deleted = all?.filter((pf) => !featureIds.includes(pf.feature_id))
  if (deleted) {
    await supabase
      .from('customer_features')
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
