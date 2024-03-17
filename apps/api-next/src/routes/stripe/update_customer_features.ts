import { HonoEnv } from '@/lib/hono/env'
import { and, eq, schema } from '@spackle/db'
import { Context } from 'hono'

// TODO: wrap in a transaction
export default async function (c: Context<HonoEnv>) {
  const { account_id, customer_id, customer_features, mode } =
    await c.req.json()

  try {
    await c.get('stripeService').getOrSyncStripeAccount(account_id)
    await c
      .get('stripeService')
      .getOrSyncStripeCustomer(account_id, customer_id, mode)

    // Update
    const updatedCustomerFeatures = customer_features
      .filter((cf: any) => cf.hasOwnProperty('id'))
      .map((cf: any) => ({
        featureId: cf.feature_id,
        id: cf.id,
        stripeAccountId: account_id,
        stripeCustomerId: customer_id,
        valueFlag: cf.value_flag,
        valueLimit: cf.value_limit,
      }))

    for (const cf of updatedCustomerFeatures) {
      await c
        .get('db')
        .update(schema.customerFeatures)
        .set(cf)
        .where(
          and(
            eq(schema.customerFeatures.stripeAccountId, cf.stripeAccountId),
            eq(schema.customerFeatures.id, cf.id),
          ),
        )
    }

    // Create new features
    const newCustomerFeatures = customer_features
      .filter((cf: any) => !cf.hasOwnProperty('id'))
      .map((cf: any) => ({
        stripeAccountId: account_id,
        stripeCustomerId: customer_id,
        featureId: cf.feature_id,
        valueLimit: cf.value_limit,
        valueFlag: cf.value_flag,
      }))

    if (newCustomerFeatures.length > 0) {
      await c
        .get('db')
        .insert(schema.customerFeatures)
        .values(newCustomerFeatures)
    }

    // Delete
    const allCustomerFeatures = await c
      .get('db')
      .select()
      .from(schema.customerFeatures)
      .where(
        and(
          eq(schema.customerFeatures.stripeAccountId, account_id),
          eq(schema.customerFeatures.stripeCustomerId, customer_id),
        ),
      )

    const featureIds = customer_features.map((cf: any) => cf.feature_id)
    const deletedCustomerFeatures = allCustomerFeatures.filter(
      (cf) => !featureIds.includes(cf.featureId),
    )
    for (const cf of deletedCustomerFeatures) {
      await c
        .get('db')
        .delete(schema.customerFeatures)
        .where(
          and(
            eq(schema.customerFeatures.stripeAccountId, cf.stripeAccountId),
            eq(schema.customerFeatures.id, cf.id),
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
