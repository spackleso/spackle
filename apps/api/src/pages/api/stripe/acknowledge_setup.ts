import type { NextApiRequest, NextApiResponse } from 'next'
import { checkCors } from '@/cors'
import { verifySignature } from '@/stripe/signature'
import supabase from 'spackle-supabase'
import * as Sentry from '@sentry/nextjs'

const acknowledgeSetup = async (account_id: string) => {
  let response = await supabase
    .from('stripe_accounts')
    .update({
      has_acknowledged_setup: true,
    })
    .eq('stripe_id', account_id)

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

  try {
    await acknowledgeSetup(account_id)
  } catch (error) {
    console.log(error)
    Sentry.captureException(error)
    return res.status(400).json({ error })
  }

  res.status(200).json({
    success: true,
  })
}

export default handler
