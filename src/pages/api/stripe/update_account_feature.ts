import type { NextApiRequest, NextApiResponse } from 'next'
import stripe from '../../../stripe'
import { checkCors } from '../../../cors'
import { supabase } from '../../../supabase/client'
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
  console.log(req.body)

  // TODO: handle all errors
  const { account_id, id, name, key, type, value_flag, value_limit } = req.body

  await syncStripeAccount(account_id)

  const { data, error } = await supabase
    .from('features')
    .update({
      name,
      key,
      type,
      value_flag,
      value_limit,
    })
    .eq('stripe_account_id', account_id)
    .eq('id', id)

  console.log(data, error)

  res.status(200).json({
    success: true,
  })
}
