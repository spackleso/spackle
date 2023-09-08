import type { NextApiRequest, NextApiResponse } from 'next'
import { getCustomerState } from '@/state'
import { verifySignature } from '@/stripe/signature'

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { success } = verifySignature(req)
  if (!success) {
    return res.status(403).json({
      error: 'Unauthorized',
    })
  }

  // TODO: handle all errors
  const { account_id, customer_id } = req.body
  const features = await getCustomerState(account_id, customer_id)

  res.status(200).json({
    data: features,
  })
}

export default handler
