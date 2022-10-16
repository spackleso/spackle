import type { NextApiRequest, NextApiResponse } from 'next'
import { liveStripe as stripe } from '../../../stripe'
import { checkCors } from '../../../cors'
import { supabase } from '../../../supabase'
import { syncStripeAccount } from '../../../stripe/sync'

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
  const { account_id, feature_id } = req.body
  await syncStripeAccount(account_id)

  if (feature_id) {
    const { data, error } = await supabase
      .from('features')
      .delete()
      .eq('stripe_account_id', account_id)
      .eq('id', feature_id)
    console.log(data, error)
  }

  res.status(200).json({
    success: true,
  })
}
