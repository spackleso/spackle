import type { NextApiRequest, NextApiResponse } from 'next'
import { checkCors } from '../../../cors'
import { getSubscriptionState } from '../../../state'
import { verifySignature } from '../../../stripe/signature'
import {
  syncStripeAccount,
  syncStripeCustomer,
  syncStripeSubscriptions,
} from '../../../stripe/sync'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  await checkCors(req, res)

  const { success } = verifySignature(req)
  if (!success) {
    return res.status(400).send('')
  }

  // TODO: handle all errors
  const { account_id, customer_id, mode } = req.body

  await syncStripeAccount(account_id)
  await syncStripeCustomer(account_id, customer_id, mode)
  await syncStripeSubscriptions(account_id, customer_id, mode)

  const features = await getSubscriptionState(account_id, customer_id)

  res.status(200).json({
    data: features || [],
  })
}
