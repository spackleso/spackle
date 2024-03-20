import { HonoEnv } from '@/lib/hono/env'
import { Context } from 'hono'

export default async function (c: Context<HonoEnv>) {
  const { account_id } = await c.req.json()
  let token
  try {
    token = await c.get('tokenService').getPublishableToken(account_id)
    if (!token) {
      token = await c.get('tokenService').createPublishableToken(account_id)
    }
  } catch (error) {
    c.get('sentry').captureException(error)
    c.status(400)
    return c.json({})
  }

  return c.json({ token: token.token })
}
