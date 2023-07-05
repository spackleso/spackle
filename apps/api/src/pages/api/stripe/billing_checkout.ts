import { NextApiRequest, NextApiResponse } from 'next'
import { liveStripe, testStripe } from '@/stripe'
import supabase from 'spackle-supabase'

enum SpackleProduct {
  entitlements = 'entitlements',
}

const isDev = process.env.NODE_ENV === 'development'
const stripe = isDev ? testStripe : liveStripe
const settingsUrl = isDev
  ? 'https://dashboard.stripe.com/test/apps/settings-preview'
  : `https://dashboard.stripe.com/settings/apps/${process.env.STRIPE_APP_ID}`

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const user_id = req.query.user_id as string
  const account_id = req.query.account_id as string
  const product = req.query.product as SpackleProduct
  const email = req.query.email as string

  if (!user_id || !account_id || !product) {
    return res.status(400).json({ error: 'Missing required parameters' })
  }

  let stripePriceId = ''
  if (product === SpackleProduct.entitlements) {
    stripePriceId = process.env.BILLING_ENTITLEMENTS_PRICE_ID as string
  } else {
    return res.status(400).json({ error: 'Invalid product' })
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
    return res.status(400).json({ error })
  }

  const { data, error } = await supabase
    .from('stripe_accounts')
    .select('*')
    .single()

  if (error) {
    return new Response(error.message, { status: 400 })
  }

  let stripeCustomerId = data.billing_stripe_customer_id || undefined
  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({ email })
    const { data: updateData, error: updateError } = await supabase
      .from('stripe_accounts')
      .update({ billing_stripe_customer_id: customer.id })
      .eq('stripe_id', data.stripe_id)
      .select()
      .single()

    if (updateError) {
      return new Response(updateError.message, { status: 400 })
    }

    stripeCustomerId = updateData.billing_stripe_customer_id || undefined
  }

  const session = await stripe.checkout.sessions.create({
    line_items: [{ price: stripePriceId }],
    mode: 'subscription',
    success_url: settingsUrl,
    cancel_url: settingsUrl,
    customer: stripeCustomerId,
    allow_promotion_codes: true,
  })

  if (session.url) {
    res.redirect(session.url)
  } else {
    res.status(400).json({ error: 'Something went wrong' })
  }
}

export default handler
