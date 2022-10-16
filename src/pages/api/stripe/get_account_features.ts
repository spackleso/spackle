import type { NextApiRequest, NextApiResponse } from 'next'
import { checkCors } from '../../../cors'
import stripe from '../../../stripe'
import { syncStripeAccount } from '../../../stripe/sync'
import { supabase } from '../../../supabase'

type Data = {
  data: any[]
}

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
  const { account_id } = req.body

  await syncStripeAccount(account_id)

  const { data, error } = await supabase
    .from('features')
    .select('id,name,key,type,value_flag,value_limit')
    .eq('stripe_account_id', account_id)
    .order('name', { ascending: true })

  res.status(200).json({
    data: data || [],
  })
}
