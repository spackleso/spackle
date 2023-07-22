import type { NextApiRequest, NextApiResponse } from 'next'
import { verifySignature } from '@/stripe/signature'
import * as Sentry from '@sentry/nextjs'
import supabase from 'spackle-supabase'
import spackle from '@/spackle'
import { getCustomerState } from '@/state'

const account = process.env.STRIPE_ACCOUNT_ID || ''
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

  let entitlements: CustomerState = {
    version: 1,
    features: [],
    subscriptions: [],
  }

  if (data.billing_stripe_customer_id) {
    entitlements = await getCustomerState(
      account,
      data.billing_stripe_customer_id,
    )
  }

  res.status(200).json(entitlements)
}

export default handler
