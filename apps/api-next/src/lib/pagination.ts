import { Context } from 'hono'
import { APIHonoEnv } from './hono/env'

export const getPagination = (c: Context<APIHonoEnv>, size: number = 10) => {
  const page = parseInt((c.req.query('page') as string) || '1') - 1
  const limit = size ? +size : 10
  const from = page ? page * limit : 0
  const to = page ? from + size : size

  return { from, to, limit: limit + 1 }
}
