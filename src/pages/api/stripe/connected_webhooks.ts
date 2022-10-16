import type { NextApiRequest, NextApiResponse } from 'next'
import stripe from '../../../stripe'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<any>,
) {
  const sig = req.headers['stripe-signature'] as string
  const payload = JSON.stringify(req.body)

  let event
  try {
    event = stripe.webhooks.constructEvent(
      payload,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET as string,
    )
  } catch (err: any) {
    console.log(err.message)
    res.status(400).json({ error: `Webhook Error: ${err.message}` })
    return
  }

  // Handle the event
  console.log(`Unhandled event type ${event.type}`)

  res.status(200).json({
    success: true,
  })
}
