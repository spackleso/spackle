import type { NextApiRequest, NextApiResponse } from 'next'
import { verifySignature } from '@/stripe/signature'
import * as Sentry from '@sentry/nextjs'
import { createPublishableToken, getPublishableToken } from '@/api'

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { success } = verifySignature(req)
  if (!success) {
    return res.status(403).json({
      error: 'Unauthorized',
    })
  }

  const { account_id } = req.body

  let token
  try {
    token = await getPublishableToken(account_id)
    if (!token) {
      token = await createPublishableToken(account_id)
    }
  } catch (error) {
    console.log(error)
    Sentry.captureException(error)
    return res.status(400).json({})
  }

  res.status(200).json({ token: token.token })
}

export default handler
