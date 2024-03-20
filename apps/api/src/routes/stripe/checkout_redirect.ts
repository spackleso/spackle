// import type { NextApiRequest, NextApiResponse } from 'next'
// import { liveStripe, testStripe } from '@/stripe'
// import { serialize } from 'cookie'

import { HonoEnv } from '@/lib/hono/env'
import { Context } from 'hono'
import { setCookie } from 'hono/cookie'

// const isDev = process.env.NODE_ENV === 'development'
// const stripe = isDev ? testStripe : liveStripe

// const handler = async (req: NextApiRequest, res: NextApiResponse) => {
//   const user_id = req.query.user_id as string
//   const account_id = req.query.account_id as string
//   const email = req.query.email as string

//   if (!user_id || !account_id || !email) {
//     return res
//       .status(400)
//       .send('Something went wrong: Missing required parameters')
//   }

//   try {
//     stripe.webhooks.signature.verifyHeader(
//       JSON.stringify({
//         user_id,
//         account_id,
//       }),
//       req.query.sig as string,
//       process.env.STRIPE_SIGNING_SECRET as string,
//     )
//   } catch (error: any) {
//     return res.status(403).json({
//       error: 'Unauthorized',
//     })
//   }

//   const domain = isDev ? 'localhost' : '.spackle.so'
//   res.setHeader('Set-Cookie', [
//     serialize('user_id', user_id, { domain, path: '/' }),
//     serialize('account_id', account_id, { domain, path: '/' }),
//     serialize('email', email, { domain, path: '/' }),
//     serialize('sig', req.query.sig as string, { domain, path: '/' }),
//   ])
//   const data = btoa(
//     JSON.stringify({
//       user_id,
//       account_id,
//       email,
//       sig: req.query.sig as string,
//     }),
//   )
//   return res.redirect(`${process.env.WEB_HOST}/checkout?session=${data}`)
// }

// export default handler

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

  try {
    stripe.webhooks.signature.verifyHeader(
      JSON.stringify({
        user_id,
        account_id,
      }),
      c.req.query('sig') as string,
      c.env.STRIPE_SIGNING_SECRET as string,
    )
  } catch (error: any) {
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
