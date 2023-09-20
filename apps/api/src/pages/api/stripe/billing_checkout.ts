import { NextApiRequest, NextApiResponse } from 'next'
import { liveStripe, testStripe } from '@/stripe'
import { SpackleProduct } from '@/types'
import db, { stripeAccounts } from '@/db'
import { eq } from 'drizzle-orm'

const isDev = process.env.NODE_ENV === 'development'
const stripe = isDev ? testStripe : liveStripe
const settingsUrl = isDev
  ? 'https://dashboard.stripe.com/test/apps/settings-preview'
  : `https://dashboard.stripe.com/settings/apps/${process.env.STRIPE_APP_ID}`
const host = process.env.HOST || ''

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
    return res.status(403).json({ error: 'Unauthorized' })
  }

  const result = await db
    .select()
    .from(stripeAccounts)
    .where(eq(stripeAccounts.stripeId, account_id))
    .limit(1)

  const account = result[0]
  let stripeCustomerId = account.billingStripeCustomerId || undefined
  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({ email })
    const result = await db
      .update(stripeAccounts)
      .set({
        billingStripeCustomerId: customer.id,
      })
      .where(eq(stripeAccounts.stripeId, account.stripeId))
      .returning()
    stripeCustomerId = result[0].billingStripeCustomerId || undefined
  }

  let session
  try {
    session = await stripe.checkout.sessions.create({
      line_items: [{ price: stripePriceId }],
      mode: 'subscription',
      success_url: `${host}/stripe/billing_checkout_success?sessionId={CHECKOUT_SESSION_ID}`,
      cancel_url: settingsUrl,
      customer: stripeCustomerId,
      allow_promotion_codes: true,
    })
  } catch (error: any) {
    return res.status(400).json({ error })
  }

  if (session.url) {
    return res.redirect(session.url)
  } else {
    return res.status(400).json({ error: 'Something went wrong' })
  }
}

export default handler
