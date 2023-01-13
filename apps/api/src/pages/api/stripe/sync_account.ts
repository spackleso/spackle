import type { NextApiRequest, NextApiResponse } from 'next'
import { checkCors } from '@/cors'
import { withLogging } from '@/logger'
import { verifySignature } from '@/stripe/signature'
import { syncAllAccountDataAsync } from '@/stripe/sync'

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  await checkCors(req, res)

  const { success } = verifySignature(req)
  if (!success) {
    return res.status(400).send('')
  }

  const { account_id } = req.body
  await syncAllAccountDataAsync(account_id)

  res.status(200).json({})
}

export default withLogging(handler)
