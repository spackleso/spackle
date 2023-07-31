import type { NextApiRequest, NextApiResponse } from 'next'
import { verifySignature } from '@/stripe/signature'
import { syncAllAccountDataAsync } from '@/stripe/sync'

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { success } = verifySignature(req)
  if (!success) {
    return res.status(403).json({
      error: 'Unauthorized',
    })
  }

  const { account_id } = req.body
  await syncAllAccountDataAsync(account_id)

  res.status(200).json({})
}

export default handler
