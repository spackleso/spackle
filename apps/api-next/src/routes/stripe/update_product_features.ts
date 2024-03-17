// import type { NextApiRequest, NextApiResponse } from 'next'
// import { verifySignature } from '@/stripe/signature'
// import * as Sentry from '@sentry/nextjs'
// import { getOrSyncStripeAccount, getOrSyncStripeProduct } from '@/stripe/sync'
// import { storeAccountStatesAsync } from '@/store/dynamodb'
// import db, { productFeatures } from '@/db'
// import { and, eq, inArray } from 'drizzle-orm'

import { HonoEnv } from '@/lib/hono/env'
import { and, eq, schema } from '@spackle/db'
import { Context } from 'hono'

// const updateProductFeatures = async (
//   stripeAccountId: string,
//   stripeProductId: string,
//   data: any[],
// ) => {
//   // Update
//   const updatedProductFeatures = data
//     .filter((pf: any) => pf.hasOwnProperty('id'))
//     .map((pf: any) => ({
//       featureId: pf.feature_id,
//       id: pf.id,
//       stripeAccountId,
//       stripeProductId,
//       valueFlag: pf.value_flag,
//       valueLimit: pf.value_limit,
//     }))

//   for (const pf of updatedProductFeatures) {
//     await db
//       .update(productFeatures)
//       .set(pf)
//       .where(
//         and(
//           eq(productFeatures.stripeAccountId, pf.stripeAccountId),
//           eq(productFeatures.id, pf.id),
//         ),
//       )
//   }

//   // Create
//   const newProductFeatures = data
//     .filter((pf: any) => !pf.hasOwnProperty('id'))
//     .map((pf: any) => ({
//       stripeAccountId,
//       stripeProductId,
//       featureId: pf.feature_id,
//       valueLimit: pf.value_limit,
//       valueFlag: pf.value_flag,
//     }))

//   if (newProductFeatures.length) {
//     await db.insert(productFeatures).values(newProductFeatures)
//   }

//   // Delete
//   const result = await db
//     .select()
//     .from(productFeatures)
//     .where(
//       and(
//         eq(productFeatures.stripeAccountId, stripeAccountId),
//         eq(productFeatures.stripeProductId, stripeProductId),
//       ),
//     )

//   const featureIds = data.map((pf: any) => pf.feature_id)
//   const deleted = result.filter((pf) => !featureIds.includes(pf.featureId))
//   for (const pf of deleted) {
//     await db
//       .delete(productFeatures)
//       .where(
//         and(
//           eq(productFeatures.stripeAccountId, stripeAccountId),
//           eq(productFeatures.id, pf.id),
//         ),
//       )
//   }

//   await storeAccountStatesAsync(stripeAccountId)
// }

// const handler = async (req: NextApiRequest, res: NextApiResponse) => {
//   const { success } = verifySignature(req)
//   if (!success) {
//     return res.status(403).json({
//       error: 'Unauthorized',
//     })
//   }

//   const { account_id, product_id, product_features, mode } = req.body
//   try {
//     await getOrSyncStripeAccount(account_id)
//     await getOrSyncStripeProduct(account_id, product_id, mode)
//     await updateProductFeatures(account_id, product_id, product_features)
//   } catch (error) {
//     Sentry.captureException(error)
//     return res.status(400).json({
//       error: (error as Error).message,
//     })
//   }

//   res.status(200).json({
//     success: true,
//   })
// }

// export default handler

export default async function (c: Context<HonoEnv>) {
  const { account_id, product_id, product_features, mode } = await c.req.json()

  try {
    await c.get('stripeService').getOrSyncStripeAccount(account_id)
    await c
      .get('stripeService')
      .getOrSyncStripeProduct(account_id, product_id, mode)

    // Update
    const updatedProductFeatures = product_features
      .filter((pf: any) => pf.hasOwnProperty('id'))
      .map((pf: any) => ({
        featureId: pf.feature_id,
        id: pf.id,
        stripeAccountId: account_id,
        stripeProductId: product_id,
        valueFlag: pf.value_flag,
        valueLimit: pf.value_limit,
      }))

    for (const pf of updatedProductFeatures) {
      await c
        .get('db')
        .update(schema.productFeatures)
        .set(pf)
        .where(
          and(
            eq(schema.productFeatures.stripeAccountId, pf.stripeAccountId),
            eq(schema.productFeatures.id, pf.id),
          ),
        )
    }

    // Create
    const newProductFeatures = product_features
      .filter((pf: any) => !pf.hasOwnProperty('id'))
      .map((pf: any) => ({
        stripeAccountId: account_id,
        stripeProductId: product_id,
        featureId: pf.feature_id,
        valueLimit: pf.value_limit,
        valueFlag: pf.value_flag,
      }))

    if (newProductFeatures.length) {
      await c
        .get('db')
        .insert(schema.productFeatures)
        .values(newProductFeatures)
    }

    // Delete
    const result = await c
      .get('db')
      .select()
      .from(schema.productFeatures)
      .where(
        and(
          eq(schema.productFeatures.stripeAccountId, account_id),
          eq(schema.productFeatures.stripeProductId, product_id),
        ),
      )

    const featureIds = product_features.map((pf: any) => pf.feature_id)
    const deleted = result.filter((pf) => !featureIds.includes(pf.featureId))
    for (const pf of deleted) {
      await c
        .get('db')
        .delete(schema.productFeatures)
        .where(
          and(
            eq(schema.productFeatures.stripeAccountId, account_id),
            eq(schema.productFeatures.id, pf.id),
          ),
        )
    }
  } catch (error) {
    c.get('sentry').captureException(error)
    c.status(400)
    return c.json({
      error: (error as Error).message,
    })
  }

  return c.json({
    success: true,
  })
}
