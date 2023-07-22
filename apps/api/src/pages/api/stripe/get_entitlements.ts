import type { NextApiRequest, NextApiResponse } from 'next'
import { verifySignature } from '@/stripe/signature'
import * as Sentry from '@sentry/nextjs'
import supabase from 'spackle-supabase'
import spackle from '@/spackle'

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { success } = verifySignature(req)
  if (!success) {
    return res.status(400).send('')
  }

  const { account_id } = req.body
  const { data, error } = await supabase
    .from('stripe_accounts')
    .select()
    .eq('stripe_id', account_id)
    .single()

  if (error) {
    Sentry.captureException(error)
    return res.status(400).json({ error })
  }

  let entitlements = {
    version: 1,
    features: [],
    subscriptions: [],
  }

  if (data.billing_stripe_customer_id) {
    const response = await fetch(
      spackle.apiBase +
        '/customers/' +
        data.billing_stripe_customer_id +
        '/state',
      {
        headers: {
          Authorization: 'Bearer ' + spackle.apiKey,
        },
      },
    )

    if (response.status !== 200) {
      return res.status(400).json({ error: 'Could not fetch customer state' })
    }

    entitlements = await response.json()
  }

  res.status(200).json(entitlements)
}

export default handler
