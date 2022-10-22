import { Logtail } from '@logtail/node'
import { NextApiHandler, NextApiRequest, NextApiResponse } from 'next'

export const logger =
  process.env.NODE_ENV === 'production'
    ? new Logtail(process.env.LOGTAIL_API_KEY || '')
    : console

export const withLogging = (handler: NextApiHandler) => {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const log = `${req.method} ${req.url} [${res.statusCode}]`
    logger.log(log)
    return handler(req, res)
  }
}
