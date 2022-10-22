import type { NextApiRequest, NextApiResponse } from 'next'
import { checkCors } from '../../../cors'
import { supabase } from '../../../supabase'
import { syncStripeAccount } from '../../../stripe/sync'
import { verifySignature } from '../../../stripe/signature'
import { withLogging } from '../../../logger'
import * as Sentry from '@sentry/nextjs'

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  await checkCors(req, res)

  const { success } = verifySignature(req)
  if (!success) {
    return res.status(400).send('')
  }

  // TODO: handle all errors
  const { account_id, id, name, value_flag, value_limit } = req.body

  await syncStripeAccount(account_id)

  const { data, error } = await supabase
    .from('features')
    .update({
      name,
      value_flag,
      value_limit,
    })
    .eq('stripe_account_id', account_id)
    .eq('id', id)

  if (error) {
    Sentry.captureException(error)
  }

  res.status(200).json({
    success: true,
  })
}

export default withLogging(handler)
