/**
 * @jest-environment node
 */
import handler from '@/pages/api/stripe/update_price_features'
import {
  createAccount,
  createFlagFeature,
  createPriceFeature,
  createStripePrice,
  createStripeProduct,
  stripeTestHandler,
  testHandler,
} from '@/tests/helpers'
import db, { priceFeatures } from 'spackle-db'
import { eq } from 'drizzle-orm'

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
    const price = await createStripePrice(account.stripeId, product.stripeId)
    const createdFeature = await createFlagFeature(
      account.stripeId,
      'Created',
      'created',
      false,
    )
    const updatedPriceFeature = await createPriceFeature(
      account.stripeId,
      'Updated',
      'updated',
      false,
      price,
    )

    await createPriceFeature(account.stripeId, 'Delete', 'delete', false, price)

    const res = await stripeTestHandler(handler, {
      body: {
        account_id: account.stripeId,
        price_id: price.stripeId,
        price_features: [
          {
            feature_id: createdFeature.id,
            value_limit: null,
            value_flag: true,
          },
          {
            id: updatedPriceFeature.id,
            feature_id: updatedPriceFeature.featureId,
            value_limit: null,
            value_flag: true,
          },
        ],
      },
    })

    expect(res._getStatusCode()).toBe(200)

    const pfs = await db
      .select()
      .from(priceFeatures)
      .where(eq(priceFeatures.stripeAccountId, account.stripeId))
      .orderBy(priceFeatures.id)

    expect(pfs.length).toBe(2)
    expect(pfs[0]).toStrictEqual({
      createdAt: updatedPriceFeature.createdAt,
      featureId: updatedPriceFeature.featureId,
      id: updatedPriceFeature.id,
      stripeAccountId: account.stripeId,
      stripePriceId: price.stripeId,
      valueFlag: true,
      valueLimit: null,
    })

    expect(pfs[1].featureId).toBe(createdFeature.id)
    expect(pfs[1].stripeAccountId).toBe(account.stripeId)
    expect(pfs[1].stripePriceId).toBe(price.stripeId)
    expect(pfs[1].valueFlag).toBe(true)
    expect(pfs[1].valueLimit).toBe(null)
  })
})
