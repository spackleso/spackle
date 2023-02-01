import type { NextApiRequest, NextApiResponse } from 'next'
import { checkCors } from '@/cors'
import supabase from 'spackle-supabase'
import { verifySignature } from '@/stripe/signature'
import * as Sentry from '@sentry/nextjs'
import { storeAccountStatesAsync } from '@/store/dynamodb'

type Data = {}

const deleteFeature = async (account_id: string, feature_id: string) => {
  const response = await supabase
    .from('features')
    .delete()
    .eq('stripe_account_id', account_id)
    .eq('id', feature_id)

  if (response.error) {
    throw new Error(response.error.message)
  }

  await storeAccountStatesAsync(account_id)
  return response
}

const handler = async (req: NextApiRequest, res: NextApiResponse<Data>) => {
  await checkCors(req, res)

  const { success } = verifySignature(req)
  if (!success) {
    return res.status(400).send('')
  }

  // TODO: handle all errors
  const { account_id, feature_id } = req.body

  if (feature_id) {
    try {
      await deleteFeature(account_id, feature_id)
    } catch (error) {
      Sentry.captureException(error)
      return res.status(400).json({
        error: (error as Error).message,
      })
    }
  }

  res.status(200).json({
    success: true,
  })
}

export default handler
