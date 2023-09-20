import type { NextApiRequest, NextApiResponse } from 'next'
import { verifySignature } from '@/stripe/signature'
import * as Sentry from '@sentry/nextjs'
import { getOrSyncStripeAccount, getOrSyncStripeCustomer } from '@/stripe/sync'
import { storeCustomerState } from '@/store/dynamodb'
import db, { customerFeatures } from '@/db'
import { and, eq, inArray } from 'drizzle-orm'

const updateCustomerFeatures = async (
  stripeAccountId: string,
  stripeCustomerId: string,
  data: any[],
) => {
  // Create new features
  const newCustomerFeatures = data
    .filter((pf: any) => !pf.hasOwnProperty('id'))
    .map((pf: any) => ({
      stripeAccountId,
      stripeCustomerId,
      featureId: pf.feature_id,
      valueLimit: pf.value_limit,
      valueFlag: pf.value_flag,
    }))

  if (newCustomerFeatures.length > 0) {
    await db.insert(customerFeatures).values(newCustomerFeatures)
  }

  // Update
  const updatedCustomerFeatures = data
    .filter((pf: any) => pf.hasOwnProperty('id'))
    .map((pf: any) => ({
      featureId: pf.feature_id,
      id: pf.id,
      stripeAccountId,
      stripeCustomerId,
      valueFlag: pf.value_flag,
      valueLimit: pf.value_limit,
    }))

  for (const pf of updatedCustomerFeatures) {
    await db
      .update(customerFeatures)
      .set(pf)
      .where(
        and(
          eq(customerFeatures.stripeAccountId, pf.stripeAccountId),
          eq(customerFeatures.id, pf.id),
        ),
      )
  }

  // Delete
  const result = await db
    .select()
    .from(customerFeatures)
    .where(
      and(
        eq(customerFeatures.stripeAccountId, stripeAccountId),
        eq(customerFeatures.stripeCustomerId, stripeCustomerId),
      ),
    )

  const featureIds = data.map((pf: any) => pf.feature_id)
  const deleted = result.filter((pf) => !featureIds.includes(pf.featureId))
  if (deleted.length) {
    await db.delete(customerFeatures).where(
      inArray(
        customerFeatures.id,
        deleted.map((pf) => pf.id),
      ),
    )
  }

  await storeCustomerState(stripeAccountId, stripeCustomerId)
}

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { success } = verifySignature(req)
  if (!success) {
    return res.status(403).json({
      error: 'Unauthorized',
    })
  }
  // TODO: handle all errors
  const { account_id, customer_id, customer_features, mode } = req.body

  try {
    await getOrSyncStripeAccount(account_id)
    await getOrSyncStripeCustomer(account_id, customer_id, mode)
    await updateCustomerFeatures(account_id, customer_id, customer_features)
  } catch (error) {
    console.error(error)
    Sentry.captureException(error)
    return res.status(400).json({
      error: (error as Error).message,
    })
  }

  res.status(200).json({
    success: true,
  })
}

export default handler
