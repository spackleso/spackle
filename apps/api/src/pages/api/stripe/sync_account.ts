import type { NextApiRequest, NextApiResponse } from 'next'
import { checkCors } from '@/cors'
import { logger, withLogging } from '@/logger'
import { verifySignature } from '@/stripe/signature'

const { BACKGROUND_API_TOKEN, HOST } = process.env

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  logger.warn('Calling deprecated endpont /api/stripe/sync_account')
  res.status(200).json({})
}

export default withLogging(handler)
