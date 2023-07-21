import type { NextApiRequest, NextApiResponse } from 'next'
import { liveStripe, testStripe } from '@/stripe'
import { serialize } from 'cookie'

const isDev = process.env.NODE_ENV === 'development'
const stripe = isDev ? testStripe : liveStripe

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const user_id = req.query.user_id as string
  const account_id = req.query.account_id as string
  const email = req.query.email as string

  if (!user_id || !account_id || !email) {
    return res
      .status(400)
      .send('Something went wrong: Missing required parameters')
  }

  try {
    stripe.webhooks.signature.verifyHeader(
      JSON.stringify({
        user_id,
        account_id,
      }),
      req.query.sig as string,
      process.env.STRIPE_SIGNING_SECRET as string,
    )
  } catch (error: any) {
    return res.status(400).send('Something went wrong')
  }

  const domain = new URL(process.env.WEB_HOST ?? '').hostname
  res.setHeader('Set-Cookie', [
    serialize('user_id', user_id, { domain, path: '/' }),
    serialize('account_id', account_id, { domain, path: '/' }),
    serialize('email', email, { domain, path: '/' }),
    serialize('sig', req.query.sig as string, { domain, path: '/' }),
  ])
  return res.redirect(`${process.env.WEB_HOST}/checkout`)
}

export default handler
