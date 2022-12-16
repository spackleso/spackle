import type { NextApiRequest, NextApiResponse } from 'next'
import { checkCors } from '../../../cors'
import { withLogging } from '../../../logger'
import { verifySignature } from '../../../stripe/signature'
import { supabase } from '../../../supabase'
import * as Sentry from '@sentry/nextjs'
import { getClient } from '@/redis'

export const SIGNING_KEY = process.env.SUPABASE_JWT_SECRET

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

export const setAccountRedisPassword = async (
  stripe_id: string,
  redis_password: string,
) => {
  const { data, error } = await supabase
    .from('stripe_accounts')
    .upsert(
      {
        stripe_id,
        redis_password,
        stripe_json: {},
      },
      { onConflict: 'stripe_id' },
    )
    .select()

  if (error) {
    throw new Error(error.message)
  }

  return data
}

const createToken = async (account_id: string) => {
  const redis = getClient()
  const password = await redis.acl('GENPASS', 128)
  await redis.acl(
    'SETUSER',
    account_id,
    'on',
    `>${password}`,
    '+get',
    `~${account_id}:*`,
  )
  setAccountRedisPassword(account_id, password)
  const token = await redis.acl('RESTTOKEN' as any, account_id, password)
  const response = await supabase
    .from('tokens')
    .insert({
      stripe_account_id: account_id,
      token: token,
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
