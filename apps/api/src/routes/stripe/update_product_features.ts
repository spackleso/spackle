import { HonoEnv } from '@/lib/hono/env'
import { and, eq, schema } from '@spackle/db'
import { Context } from 'hono'

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
