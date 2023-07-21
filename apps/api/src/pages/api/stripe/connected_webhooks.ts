import type { NextApiRequest, NextApiResponse } from 'next'
import { buffer, handleWebhook } from '@/stripe/webhooks'
import * as Sentry from '@sentry/nextjs'
import { liveStripe as stripe } from '@/stripe'

export const config = {
  api: {
    bodyParser: false,
  },
}

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  // Live webhook endpoints receive both live and test events.
  const webhookSigningSecret = process.env.STRIPE_CONNECTED_WEBHOOK_SECRET || ''
  if (req.method === 'POST') {
    try {
      const sig = req.headers['stripe-signature'] as string
      const buf = await buffer(req)
      const rawBody = buf.toString('utf8')

      let event
      try {
        event = stripe.webhooks.constructEvent(
          rawBody,
          sig,
          webhookSigningSecret,
        )
      } catch (err: any) {
        throw err
      }

      await handleWebhook(event.account!, event)
    } catch (error: any) {
      console.error(error)
      Sentry.captureException(error)
      return res.status(400).json({ error: `Webhook Error: ${error.message}` })
    }
    return res.status(200).json({ success: true })
  } else {
    res.setHeader('Allow', 'POST')
    return res.status(405).end('Method Not Allowed')
  }
}

export default handler
