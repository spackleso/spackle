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
  await db.transaction(async (trx) => {
    // Update
    const updatedCustomerFeatures = data
      .filter((cf: any) => cf.hasOwnProperty('id'))
      .map((cf: any) => ({
        featureId: cf.feature_id,
        id: cf.id,
        stripeAccountId,
        stripeCustomerId,
        valueFlag: cf.value_flag,
        valueLimit: cf.value_limit,
      }))

    console.log('updatedCustomerFeatures', updatedCustomerFeatures)
    for (const cf of updatedCustomerFeatures) {
      await trx
        .update(customerFeatures)
        .set(cf)
        .where(
          and(
            eq(customerFeatures.stripeAccountId, cf.stripeAccountId),
            eq(customerFeatures.id, cf.id),
          ),
        )
    }

    // Create new features
    const newCustomerFeatures = data
      .filter((cf: any) => !cf.hasOwnProperty('id'))
      .map((cf: any) => ({
        stripeAccountId,
        stripeCustomerId,
        featureId: cf.feature_id,
        valueLimit: cf.value_limit,
        valueFlag: cf.value_flag,
      }))

    console.log('newCustomerFeatures', newCustomerFeatures)
    if (newCustomerFeatures.length > 0) {
      await trx.insert(customerFeatures).values(newCustomerFeatures)
    }

    // Delete
    const result = await trx
      .select()
      .from(customerFeatures)
      .where(
        and(
          eq(customerFeatures.stripeAccountId, stripeAccountId),
          eq(customerFeatures.stripeCustomerId, stripeCustomerId),
        ),
      )

    const featureIds = data.map((cf: any) => cf.feature_id)
    const deletedCustomerFeatures = result.filter(
      (cf) => !featureIds.includes(cf.featureId),
    )
    console.log('deleted', deletedCustomerFeatures)
    if (deletedCustomerFeatures.length) {
      await trx.delete(customerFeatures).where(
        inArray(
          customerFeatures.id,
          deletedCustomerFeatures.map((cf) => cf.id),
        ),
      )
    }

    console.log('updateCustomerFeatures', {
      stripeAccountId,
      stripeCustomerId,
      data,
      updatedCustomerFeatures,
      newCustomerFeatures,
      deletedCustomerFeatures,
    })
  })

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
