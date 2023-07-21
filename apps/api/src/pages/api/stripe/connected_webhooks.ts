import type { NextApiRequest, NextApiResponse } from 'next'
import { handleWebhook } from '@/stripe/webhooks'
import * as Sentry from '@sentry/nextjs'

// Live webhook endpoints receive both live and test events.
const webhookSigningSecret = process.env.STRIPE_CONNECTED_WEBHOOK_SECRET || ''

export const config = {
  api: {
    bodyParser: false,
  },
}

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === 'POST') {
    try {
      await handleWebhook(req, webhookSigningSecret)
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
