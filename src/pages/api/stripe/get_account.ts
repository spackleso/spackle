import type { NextApiRequest, NextApiResponse } from 'next'
import { checkCors } from '../../../cors'
import { withLogging } from '../../../logger'
import { verifySignature } from '../../../stripe/signature'
import { supabase } from '../../../supabase'
import * as Sentry from '@sentry/nextjs'

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  await checkCors(req, res)

  const { success } = verifySignature(req)
  if (!success) {
    return res.status(400).send('')
  }

  // TODO: handle all errors
  const { account_id } = req.body

  const { data, error } = await supabase
    .from('stripe_accounts')
    .select(
      `
        id,
        initial_sync_complete,
        initial_sync_started_at
      `,
    )
    .eq('stripe_id', account_id)

  if (error) {
    Sentry.captureException(error)
  }

  res.status(200).json(data?.length ? data[0] : {})
}

export default withLogging(handler)
