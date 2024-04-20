import { HonoEnv } from '@/lib/hono/env'
import { Context } from 'hono'
import { setCookie } from 'hono/cookie'

export default async function (c: Context<HonoEnv>) {
  const isDev = c.env.ENVIRONMENT === 'development'
  const stripe = isDev ? c.get('testStripe') : c.get('liveStripe')
  const user_id = c.req.query('user_id')
  const account_id = c.req.query('account_id')
  const email = c.req.query('email')

  if (!user_id || !account_id || !email) {
    c.status(400)
    return c.text('Something went wrong: Missing required parameters')
  }

  let verified = false
  try {
    verified = await stripe.webhooks.signature.verifyHeaderAsync(
      JSON.stringify({
        user_id,
        account_id,
      }),
      c.req.query('sig') as string,
      c.env.STRIPE_SIGNING_SECRET as string,
    )
  } catch (error: any) {}

  if (!verified) {
    c.status(403)
    return c.json({
      error: 'Unauthorized',
    })
  }

  const domain = isDev ? 'localhost' : '.spackle.so'
  setCookie(c, 'user_id', user_id, { domain, path: '/' })
  setCookie(c, 'account_id', account_id, { domain, path: '/' })
  setCookie(c, 'email', email, { domain, path: '/' })
  setCookie(c, 'sig', c.req.query('sig') as string, { domain, path: '/' })
  const data = btoa(
    JSON.stringify({
      user_id,
      account_id,
      email,
      sig: c.req.query('sig') as string,
    }),
  )
  return c.redirect(`${c.env.WEB_HOST}/checkout?session=${data}`)
}
