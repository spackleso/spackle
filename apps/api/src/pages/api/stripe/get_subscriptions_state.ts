import type { NextApiRequest, NextApiResponse } from 'next'
import { getSubscriptionFeaturesState } from '@/state'
import { verifySignature } from '@/stripe/signature'
import { getOrSyncStripeCustomer } from '@/stripe/sync'

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { success } = verifySignature(req)
  if (!success) {
    return res.status(400).send('')
  }

  // TODO: handle all errors
  const { account_id, customer_id, mode } = req.body

  await getOrSyncStripeCustomer(account_id, customer_id, mode)
  const features = await getSubscriptionFeaturesState(account_id, customer_id)

  res.status(200).json({
    data: features || [],
  })
}

export default handler
