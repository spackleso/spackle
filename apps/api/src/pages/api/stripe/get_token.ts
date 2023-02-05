import type { NextApiRequest, NextApiResponse } from 'next'
import { verifySignature } from '@/stripe/signature'
import * as Sentry from '@sentry/nextjs'
import { createToken, getToken } from '@/api'

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { success } = verifySignature(req)
  if (!success) {
    return res.status(400).send('')
  }

  const { account_id } = req.body

  let token
  try {
    const { data: tokens } = await getToken(account_id)
    if (tokens.length) {
      token = tokens[0].token
    } else {
      const { data: tokens } = await createToken(account_id)
      token = tokens[0].token
    }
  } catch (error) {
    console.log(error)
    Sentry.captureException(error)
    return res.status(400).json({})
  }

  res.status(200).json({ token })
}

export default handler
