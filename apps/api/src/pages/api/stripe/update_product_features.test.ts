/**
 * @jest-environment node
 */
import handler from '@/pages/api/stripe/update_product_features'
import {
  createAccount,
  createFlagFeature,
  createProductFeature,
  createStripeProduct,
  stripeTestHandler,
  testHandler,
} from '@/tests/helpers'
import { eq } from 'drizzle-orm'
import db, { productFeatures } from '@/db'

describe('POST', () => {
  test('Requires a signature', async () => {
    const res = await testHandler(handler, {
      method: 'POST',
      body: {},
    })

    expect(res._getStatusCode()).toBe(403)
    expect(res._getData()).toBe(
      JSON.stringify({
        error: 'Unauthorized',
      }),
    )
  })

  test('Creates, updates, and deletes product features based on client state', async () => {
    const account = await createAccount()
    const product = await createStripeProduct(account.stripeId)
    const createdFeature = await createFlagFeature(
      account.stripeId,
      'Created',
      'created',
      false,
    )
    const updatedProductFeature = await createProductFeature(
      account.stripeId,
      false,
      {
        name: 'Updated',
        key: 'updated',
        product,
      },
    )

    await createProductFeature(account.stripeId, false, {
      name: 'Delete',
      key: 'delete',
      product,
    })

    const res = await stripeTestHandler(handler, {
      body: {
        account_id: account.stripeId,
        product_id: product.stripeId,
        product_features: [
          {
            feature_id: createdFeature.id,
            value_limit: null,
            value_flag: true,
          },
          {
            id: updatedProductFeature.id,
            feature_id: updatedProductFeature.featureId,
            value_limit: null,
            value_flag: true,
          },
        ],
      },
    })

    expect(res._getStatusCode()).toBe(200)

    const pfs = await db
      .select()
      .from(productFeatures)
      .where(eq(productFeatures.stripeAccountId, account.stripeId))
      .orderBy(productFeatures.id)

    expect(pfs.length).toBe(2)
    expect(pfs[0]).toStrictEqual({
      createdAt: updatedProductFeature.createdAt,
      featureId: updatedProductFeature.featureId,
      id: updatedProductFeature.id,
      stripeAccountId: account.stripeId,
      stripeProductId: product.stripeId,
      valueFlag: true,
      valueLimit: null,
    })

    expect(pfs[1].featureId).toBe(createdFeature.id)
    expect(pfs[1].stripeAccountId).toBe(account.stripeId)
    expect(pfs[1].stripeProductId).toBe(product.stripeId)
    expect(pfs[1].valueFlag).toBe(true)
    expect(pfs[1].valueLimit).toBe(null)
  })
})
