import type { NextApiRequest, NextApiResponse } from 'next'
import { checkCors } from '../../../cors'
import { withLogging } from '../../../logger'
import { verifySignature } from '../../../stripe/signature'
import { supabase } from '../../../supabase'
import * as Sentry from '@sentry/nextjs'
import { z } from 'zod'

const acceptInvite = async (account_id: string, invite_id: number) => {
  let response = await supabase
    .from('stripe_accounts')
    .update({
      invite_id: invite_id,
    })
    .eq('stripe_id', account_id)

  if (response.error) {
    throw new Error(response.error.message)
  }

  return response
}

const fetchUnacceptedInvite = async (token: string) => {
  const response = await supabase
    .from('invites')
    .select('*,stripe_accounts(id)')
    .eq('token', token)
    .limit(1)
    .single()

  if (response.error) {
    return response
  } else if (response.data.stripe_accounts.length) {
    return { data: null, error: response.error }
  }

  return response
}

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  await checkCors(req, res)

  const { success } = verifySignature(req)
  if (!success) {
    return res.status(400).send('')
  }

  // Validate inputs
  const { account_id, token } = req.body
  const schema = z.object({
    token: z.string(),
  })
  const validation = schema.safeParse({ token })
  if (!validation.success) {
    return res.status(400).json({
      error: validation.error,
    })
  }

  const { data: invite, error } = await fetchUnacceptedInvite(token)
  if (!invite || error) {
    return res.status(400).json({ error: 'Invalid token' })
  }

  try {
    await acceptInvite(account_id, invite.id)
  } catch (error) {
    console.log(error)
    Sentry.captureException(error)
    return res.status(400).json({ error })
  }

  res.status(200).json({
    success: true,
  })
}

export default withLogging(handler)
