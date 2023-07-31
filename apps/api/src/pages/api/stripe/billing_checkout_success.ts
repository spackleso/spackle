import { NextApiRequest, NextApiResponse } from 'next'
import { liveStripe, testStripe } from '@/stripe'
import { syncStripeCustomer, syncStripeSubscriptions } from '@/stripe/sync'

const isDev = process.env.NODE_ENV === 'development'
const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const stripe = isDev ? testStripe : liveStripe
  const settingsUrl = isDev
    ? 'https://dashboard.stripe.com/test/apps/settings-preview'
    : `https://dashboard.stripe.com/settings/apps/${process.env.STRIPE_APP_ID}`

  const stripeAccountId = process.env.STRIPE_ACCOUNT_ID || ''
  const sessionId = req.query.sessionId as string
  const session = await stripe.checkout.sessions.retrieve(sessionId)
  await syncStripeCustomer(
    stripeAccountId,
    session.customer as string,
    isDev ? 'test' : 'live',
  )
  await syncStripeSubscriptions(
    stripeAccountId,
    session.customer as string,
    isDev ? 'test' : 'live',
  )
  res.redirect(settingsUrl)
}

export default handler
