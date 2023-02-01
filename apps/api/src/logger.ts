import { Logtail } from '@logtail/node'

export const logger = process.env.LOGTAIL_API_KEY
  ? new Logtail(process.env.LOGTAIL_API_KEY || '')
  : console
