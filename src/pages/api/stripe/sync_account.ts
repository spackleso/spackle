import type { NextApiRequest, NextApiResponse } from 'next'
import { checkCors } from '../../../cors'
import { getAccountState } from '../../../state'
import { verifySignature } from '../../../stripe/signature'
import { syncStripeAccount } from '../../../stripe/sync'
import { supabase } from '../../../supabase'

const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http'

// TODO: secure via Stripe signature
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  await checkCors(req, res)

  const { success } = verifySignature(req)
  if (!success) {
    return res.status(400).send('')
  }

  const { account_id } = req.body

  await syncStripeAccount(account_id)
  await fetch(
    `${protocol}://${req.headers.host}/.netlify/functions/sync_stripe-background?account_id=${account_id}`,
  )

  res.status(200).json({})
}
