import type { NextApiRequest, NextApiResponse } from 'next'
import stripe from '../../../stripe'
import type { Readable } from 'node:stream'

export const config = {
  api: {
    bodyParser: false,
  },
}

async function buffer(readable: Readable) {
  const chunks = []
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
  }
  return Buffer.concat(chunks)
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === 'POST') {
    const sig = req.headers['stripe-signature'] as string
    const buf = await buffer(req)
    const rawBody = buf.toString('utf8')

    let event
    try {
      event = stripe.webhooks.constructEvent(
        rawBody,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET as string,
      )
    } catch (err: any) {
      console.log(err.message)
      res.status(400).json({ error: `Webhook Error: ${err.message}` })
      return
    }

    res.json({ success: true })
    console.log(`Unhandled event type ${event.type}`)
  } else {
    res.setHeader('Allow', 'POST')
    res.status(405).end('Method Not Allowed')
  }
}
