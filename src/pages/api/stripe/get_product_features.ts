import type { NextApiRequest, NextApiResponse } from 'next'
import { liveStripe as stripe } from '../../../stripe'
import { checkCors } from '../../../cors'
import { supabase } from '../../../supabase'
import { syncStripeAccount, syncStripeProduct } from '../../../stripe/sync'

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

  const { account_id, product_id, mode } = req.body

  await syncStripeAccount(account_id)
  await syncStripeProduct(account_id, product_id, mode)

  const { data, error } = await supabase
    .from('product_features')
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
    .eq('stripe_product_id', product_id)
    .order('name', { foreignTable: 'features', ascending: true })

  // TODO: pop features key before serialization
  res.status(200).json({
    data: data || [],
  })
}
