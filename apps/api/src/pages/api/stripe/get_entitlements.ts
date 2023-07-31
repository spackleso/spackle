import type { NextApiRequest, NextApiResponse } from 'next'
import { verifySignature } from '@/stripe/signature'
import { getCustomerState } from '@/state'
import { CustomerState } from '@/types'
import db, { stripeAccounts } from 'spackle-db'
import { eq } from 'drizzle-orm'

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { success, error } = verifySignature(req)
  if (!success) {
    return res.status(403).json({
      error: 'Unauthorized',
    })
  }

  const { account_id } = req.body
  const result = await db
    .select()
    .from(stripeAccounts)
    .where(eq(stripeAccounts.stripeId, account_id))

  const data = result[0]

  let entitlements: CustomerState = {
    version: 1,
    features: [],
    subscriptions: [],
  }

  const account = process.env.STRIPE_ACCOUNT_ID || ''
  if (data.billingStripeCustomerId) {
    entitlements = await getCustomerState(account, data.billingStripeCustomerId)
  }

  res.status(200).json(entitlements)
}

export default handler
