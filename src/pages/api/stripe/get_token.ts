import type { NextApiRequest, NextApiResponse } from 'next'
import { checkCors } from '../../../cors'
import { verifySignature } from '../../../stripe/signature'
import { supabase } from '../../../supabase'
import * as Sentry from '@sentry/nextjs'
import jwt from 'jsonwebtoken'
import { withLogging } from '@/logger'

const SIGNING_KEY = process.env.SUPABASE_JWT_SECRET

const fetchToken = async (account_id: string) => {
  const response = await supabase
    .from('tokens')
    .select('token')
    .eq('stripe_account_id', account_id)

  if (response.error) {
    throw new Error(response.error.message)
  }

  return response
}

const createToken = async (account_id: string) => {
  if (!SIGNING_KEY) {
    throw new Error('Signing key not set')
  }

  const response = await supabase
    .from('tokens')
    .insert({
      stripe_account_id: account_id,
      token: jwt.sign(
        {
          sub: account_id,
          iat: Math.floor(Date.now() / 1000),
        },
        SIGNING_KEY,
      ),
    })
    .select()

  if (response.error) {
    throw new Error(response.error.message)
  }

  return response
}

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  await checkCors(req, res)

  const { success } = verifySignature(req)
  if (!success) {
    return res.status(400).send('')
  }

  const { account_id } = req.body

  let token
  try {
    const { data: tokens } = await fetchToken(account_id)
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

export default withLogging(handler)
