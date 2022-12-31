import { NextApiRequest } from 'next'
import { liveStripe as stripe } from '.'

export const verifySignature = (req: NextApiRequest) => {
  const sig = req.headers['stripe-signature'] as string
  const payload = JSON.stringify(req.body)

  try {
    stripe.webhooks.signature.verifyHeader(
      payload,
      sig,
      process.env.STRIPE_SIGNING_SECRET as string,
    )
  } catch (error: any) {
    return { success: false, error: error }
  }
  return { success: true, error: null }
}
