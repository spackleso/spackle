import type { NextApiRequest, NextApiResponse } from 'next'
import { checkCors } from '../../../cors'
import stripe from '../../../stripe'
import { supabase } from '../../../supabase/client'

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

  const { data: account, error: accountError } = await supabase
    .from('stripe_accounts')
    .insert([{ stripe_id: account_id }])

  const { data: features, error: featuresError } = await supabase
    .from('features')
    .select('id,name,key,type,value_flag,value_limit')
    .eq('stripe_account_id', account_id)
    .order('name', { ascending: true })

  res.status(200).json({
    data: features || [],
  })
}
