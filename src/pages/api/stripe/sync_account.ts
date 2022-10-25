import type { NextApiRequest, NextApiResponse } from 'next'
import { checkCors } from '../../../cors'
import { withLogging } from '../../../logger'
import { verifySignature } from '../../../stripe/signature'

const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http'

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  await checkCors(req, res)

  const { success } = verifySignature(req)
  if (!success) {
    return res.status(400).send('')
  }

  const { account_id } = req.body
  await fetch(
    `${protocol}://${req.headers.host}/.netlify/functions/sync_stripe-background?account_id=${account_id}`,
  )

  res.status(200).json({})
}

export default withLogging(handler)
