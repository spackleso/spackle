import type { NextApiRequest, NextApiResponse } from 'next'
import { checkCors } from '../../../cors'
import { supabase } from '../../../supabase'
import { syncStripeAccount } from '../../../stripe/sync'
import { verifySignature } from '../../../stripe/signature'
import { withLogging } from '../../../logger'
import { PostgrestResponse } from '@supabase/supabase-js'
import * as Sentry from '@sentry/nextjs'

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

  return response
}

const handler = async (req: NextApiRequest, res: NextApiResponse<Data>) => {
  await checkCors(req, res)

  const { success } = verifySignature(req)
  if (!success) {
    return res.status(400).json({
      error: 'Signature verification failed',
    })
  }

  const { account_id, name, key, type, value_flag, value_limit } = req.body

  await syncStripeAccount(account_id)
  try {
    await createFeature(account_id, name, key, type, value_flag, value_limit)
  } catch (error) {
    Sentry.captureException(error)
    return res.status(400).json({
      error: (error as Error).message,
    })
  }

  return res.status(201).json({
    success: true,
  })
}

export default withLogging(handler)
