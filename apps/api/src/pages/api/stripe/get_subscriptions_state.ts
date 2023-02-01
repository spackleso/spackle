import type { NextApiRequest, NextApiResponse } from 'next'
import { checkCors } from '@/cors'
import { getSubscriptionFeaturesState } from '@/state'
import { verifySignature } from '@/stripe/signature'

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  await checkCors(req, res)

  const { success } = verifySignature(req)
  if (!success) {
    return res.status(400).send('')
  }

  // TODO: handle all errors
  const { account_id, customer_id, mode } = req.body

  const features = await getSubscriptionFeaturesState(account_id, customer_id)

  res.status(200).json({
    data: features || [],
  })
}

export default handler
