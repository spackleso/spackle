import { verifySignature } from '@/stripe/signature'
import { NextApiRequest, NextApiResponse } from 'next'
import { getMTREstimate } from '@/billing'

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { success } = verifySignature(req)
  if (!success) {
    return res.status(403).json({
      error: 'Unauthorized',
    })
  }

  const { account_id } = req.body
  const mtr = await getMTREstimate(account_id)
  return res.status(200).json({ mtr })
}

export default handler
