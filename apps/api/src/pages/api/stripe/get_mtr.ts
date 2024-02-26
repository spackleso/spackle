import { verifySignature } from '@/stripe/signature'
import { NextApiRequest, NextApiResponse } from 'next'
import { getMTR } from '@/billing'

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { success } = verifySignature(req)
  if (!success) {
    return res.status(403).json({
      error: 'Unauthorized',
    })
  }

  const { account_id } = req.body
  try {
    const mtr = await getMTR(account_id)
    return res.status(200).json(mtr)
  } catch (error: any) {
    return res.status(400).json({ error: error.message })
  }
}

export default handler
