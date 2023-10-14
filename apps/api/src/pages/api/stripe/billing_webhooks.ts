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
  const webhookSigningSecret = process.env.STRIPE_BILLING_WEBHOOK_SECRET || ''
  const account = process.env.STRIPE_ACCOUNT_ID || ''
  if (req.method === 'POST') {
    try {
      const sig = req.headers['stripe-signature'] as string
      const buf = await buffer(req)
      const rawBody = buf.toString('utf8')

      let event = stripe.webhooks.constructEvent(
        rawBody,
        sig,
        webhookSigningSecret,
      )

      Sentry.setContext('stripeEvent', event)
      await handleWebhook(account, event)
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
