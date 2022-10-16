import type { NextApiRequest, NextApiResponse } from 'next'
import { checkCors } from '../../../cors'
import { getProductState } from '../../../state'
import stripe from '../../../stripe'
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

  // TODO: handle all errors
  const { account_id, product_id } = req.body

  await syncStripeAccount(account_id)
  await syncStripeProduct(account_id, product_id)

  const features = await getProductState(account_id, product_id)

  res.status(200).json({
    data: features,
  })
}
