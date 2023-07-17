import { NextApiRequest, NextApiResponse } from 'next'
import { liveStripe, testStripe } from '@/stripe'
import supabase from 'spackle-supabase'

const isDev = process.env.NODE_ENV === 'development'
const stripe = isDev ? testStripe : liveStripe
const settingsUrl = isDev
  ? 'https://dashboard.stripe.com/test/apps/settings-preview'
  : `https://dashboard.stripe.com/settings/apps/${process.env.STRIPE_APP_ID}`

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const user_id = req.query.user_id as string
  const account_id = req.query.account_id as string

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
    return res.status(400).json({ error })
  }

  const { data, error } = await supabase
    .from('stripe_accounts')
    .select('*')
    .single()

  if (error) {
    return res.status(400).json({ error: error.message })
  }

  let stripeCustomerId = data.billing_stripe_customer_id || undefined
  if (!stripeCustomerId) {
    return res.status(400).json({ error: 'Account not found' })
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: settingsUrl,
  })

  if (session.url) {
    res.redirect(session.url)
  } else {
    res.status(400).json({ error: 'Something went wrong' })
  }
}

export default handler
