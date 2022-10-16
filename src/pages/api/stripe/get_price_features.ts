import type { NextApiRequest, NextApiResponse } from 'next'
import stripe from '../../../stripe'
import { checkCors } from '../../../cors'
import { syncStripeAccount, syncStripePrice } from '../../../stripe/sync'
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

  const { account_id, price_id } = req.body

  await syncStripeAccount(account_id)
  await syncStripePrice(account_id, price_id)

  const { data, error } = await supabase
    .from('price_features')
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
    .eq('stripe_price_id', price_id)
    .order('name', { foreignTable: 'features', ascending: true })

  res.status(200).json({
    data: data || [],
  })
}
