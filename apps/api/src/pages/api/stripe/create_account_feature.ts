import type { NextApiRequest, NextApiResponse } from 'next'
import supabase from 'spackle-supabase'
import { verifySignature } from '@/stripe/signature'
import { PostgrestResponse } from '@supabase/supabase-js'
import * as Sentry from '@sentry/nextjs'
import { storeAccountStatesAsync } from '@/store/dynamodb'
import { upsertStripeUser } from '@/stripe/db'
import { track } from '@/posthog'

type Data = {
  success?: boolean
  error?: string
}

const createFeature = async (
  account_id: string,
  name: string,
  key: string,
  type: number,
  value_flag: boolean | null,
  value_limit: number | null,
): Promise<PostgrestResponse<any>> => {
  const response = await supabase.from('features').insert({
    name,
    key,
    type,
    value_flag,
    value_limit,
    stripe_account_id: account_id,
  })

  if (response.error) {
    throw new Error(response.error.message)
  }

  await storeAccountStatesAsync(account_id)
  return response
}

const handler = async (req: NextApiRequest, res: NextApiResponse<Data>) => {
  const { success } = verifySignature(req)
  if (!success) {
    return res.status(400).json({
      error: 'Signature verification failed',
    })
  }

  const {
    account_id,
    name,
    key,
    type,
    value_flag,
    value_limit,
    user_id,
    user_email,
    user_name,
  } = req.body

  try {
    await createFeature(account_id, name, key, type, value_flag, value_limit)
  } catch (error) {
    Sentry.captureException(error)
    return res.status(400).json({
      error: (error as Error).message,
    })
  }

  const user = await upsertStripeUser(
    account_id,
    user_id,
    user_email,
    user_name,
  )

  if (user) {
    await track(user.id.toString(), 'Created feature', {})
  }

  return res.status(201).json({
    success: true,
  })
}

export default handler
