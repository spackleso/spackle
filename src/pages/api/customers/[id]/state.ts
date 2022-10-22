import { NextApiRequest, NextApiResponse } from 'next'
import { getCustomerState } from '../../../../state'
import { supabase } from '../../../../supabase'
import * as Sentry from '@sentry/nextjs'

type Data = {}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>,
) {
  const accountId = req.headers['spackle-account-id']
  const { data: accountList, error: accountError } = await supabase
    .from('stripe_accounts')
    .select('*')
    .eq('stripe_id', accountId)

  if (!accountList || accountError) {
    Sentry.captureException(accountError)
    res.status(403).send('')
    return
  }

  const account = accountList[0]
  const authorization = req.headers['authorization'] || 'Basic '
  const signature = authorization.split(' ')[1]

  if (signature !== account.secret_key) {
    res.status(403).send('')
  }

  const { id } = req.query
  const state = await getCustomerState(account.stripe_id, id as string)

  res.status(200).json({
    data: state,
  })
}
