import type { NextApiRequest, NextApiResponse } from 'next'
import { checkCors } from '../../../cors'
import { getSubscriptionState } from '../../../state'
import { liveStripe as stripe } from '../../../stripe'
import {
  syncStripeAccount,
  syncStripeCustomer,
  syncStripeSubscriptions,
} from '../../../stripe/sync'

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
  const { account_id, customer_id, mode } = req.body

  await syncStripeAccount(account_id)
  await syncStripeCustomer(account_id, customer_id, mode)
  await syncStripeSubscriptions(account_id, customer_id, mode)

  const features = await getSubscriptionState(account_id, customer_id)

  res.status(200).json({
    data: features || [],
  })
}
