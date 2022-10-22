import type { NextApiRequest, NextApiResponse } from 'next'
import { checkCors } from '../../../cors'
import { supabase } from '../../../supabase'
import { syncStripeAccount } from '../../../stripe/sync'
import { verifySignature } from '../../../stripe/signature'
import { withLogging } from '../../../logger'
import * as Sentry from '@sentry/nextjs'

const updateFeature = async (
  account_id: string,
  id: string,
  name: string,
  value_flag: boolean | null,
  value_limit: number | null,
) => {
  const response = await supabase
    .from('features')
    .update({
      name,
      value_flag,
      value_limit,
    })
    .eq('stripe_account_id', account_id)
    .eq('id', id)

  if (response.error) {
    throw new Error(response.error?.message)
  }

  return response
}

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  await checkCors(req, res)

  const { success } = verifySignature(req)
  if (!success) {
    return res.status(400).send('')
  }

  const { account_id, id, name, value_flag, value_limit } = req.body

  await syncStripeAccount(account_id)
  try {
    await updateFeature(account_id, id, name, value_flag, value_limit)
  } catch (error) {
    Sentry.captureException(error)
    return res.status(400).json({
      error: (error as Error).message,
    })
  }

  res.status(200).json({
    success: true,
  })
}

export default withLogging(handler)
