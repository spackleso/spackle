import type { NextApiRequest, NextApiResponse } from 'next'
import { checkCors } from '@/cors'
import supabase from 'spackle-supabase'
import { verifySignature } from '@/stripe/signature'
import * as Sentry from '@sentry/nextjs'

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  await checkCors(req, res)

  const { success } = verifySignature(req)
  if (!success) {
    return res.status(400).send('')
  }

  const { account_id, customer_id, mode } = req.body

  const { data, error } = await supabase
    .from('customer_features')
    .select(
      `
        id,
        feature_id,
        value_flag,
        value_limit,
        features(name)
      `,
    )
    .eq('stripe_account_id', account_id)
    .eq('stripe_customer_id', customer_id)
    .order('name', { foreignTable: 'features', ascending: true })

  if (error) {
    Sentry.captureException(error)
  }

  res.status(200).json({
    data: data || [],
  })
}

export default handler
