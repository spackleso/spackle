import type { NextApiRequest, NextApiResponse } from 'next'
import { checkCors } from '@/cors'
import { withLogging } from '@/logger'
import { verifySignature } from '@/stripe/signature'

const { BACKGROUND_API_TOKEN, HOST } = process.env

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  await checkCors(req, res)

  const { success } = verifySignature(req)
  if (!success) {
    return res.status(400).send('')
  }

  const { account_id } = req.body
  await fetch(
    `${HOST}/.netlify/functions/sync_stripe-background?stripe_account_id=${account_id}`,
    {
      headers: {
        authorization: `Token ${BACKGROUND_API_TOKEN}`,
      },
    },
  )

  res.status(200).json({})
}

export default withLogging(handler)
