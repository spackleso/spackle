import type { NextApiRequest, NextApiResponse } from 'next'
import { handleWebhook } from '@/stripe/webhooks'

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
    } catch (err: any) {
      return res.status(400).json({ error: `Webhook Error: ${err.message}` })
    }
    res.status(200).json({ success: true })
  } else {
    res.setHeader('Allow', 'POST')
    res.status(405).end('Method Not Allowed')
  }
}

export default handler
