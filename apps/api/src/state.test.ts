/**
 * @jest-environment node
 */
import {
  getAccountFeaturesState,
  getCustomerFeaturesState,
  getCustomerSubscriptionsState,
  getPriceFeaturesState,
  getProductFeaturesState,
} from './state'
import {
  createAccount,
  createStripeCustomer,
  createFlagFeature,
  createLimitFeature,
  genStripeId,
  createStripeProduct,
  createStripePrice,
  createStripeSubscription,
} from '@/tests/helpers'
import db, {
  customerFeatures,
  priceFeatures,
  productFeatures,
  stripePrices,
  stripeProducts,
} from 'spackle-db'

describe('Features state', () => {
  test('Get accounts state should return all account features', async () => {
    const account = await createAccount()
    const feature = await createFlagFeature(
      account.stripeId,
      'Feature',
      'feature',
      false,
    )
    const state = await getAccountFeaturesState(account.stripeId)
    expect(state).toStrictEqual([
      {
        id: feature.id,
        key: 'feature',
        name: 'Feature',
        type: 0,
        value_flag: false,
        value_limit: null,
      },
    ])
  })

  test('Get product state should return overridden account features', async () => {
    const account = await createAccount()
    const feature = await createFlagFeature(
      account.stripeId,
      'Feature',
      'feature',
      false,
    )

    const sProducts = await db
      .insert(stripeProducts)
      .values({
        stripeId: genStripeId('prod'),
        stripeAccountId: account.stripeId,
      })
      .returning()
    const product = sProducts[0]

    await db
      .insert(productFeatures)
      .values({
        valueFlag: true,
        stripeAccountId: account.stripeId,
        stripeProductId: product.stripeId,
        featureId: feature.id,
      })
      .returning()

    const state = await getProductFeaturesState(
      account.stripeId,
      product.stripeId,
    )
    expect(state).toStrictEqual([
      {
        id: feature.id,
        key: 'feature',
        name: 'Feature',
        type: 0,
        value_flag: true,
        value_limit: null,
      },
    ])
  })

  test('Get price state should return overridden account features', async () => {
    const account = await createAccount()
    const feature = await createFlagFeature(
      account.stripeId,
      'Feature',
      'feature',
      false,
    )

    const sProducts = await db
      .insert(stripeProducts)
      .values({
        stripeId: genStripeId('prod'),
        stripeAccountId: account.stripeId,
      })
      .returning()
    const product = sProducts[0]

    const sPrices = await db
      .insert(stripePrices)
      .values({
        stripeId: genStripeId('price'),
        stripeAccountId: account.stripeId,
        stripeProductId: product.stripeId,
      })
      .returning()
    const price = sPrices[0]

    await db.insert(priceFeatures).values({
      valueFlag: true,
      stripeAccountId: account.stripeId,
      stripePriceId: price.stripeId,
      featureId: feature.id,
    })

    const state = await getPriceFeaturesState(
      account.stripeId,
      product.stripeId,
      price.stripeId,
    )
    expect(state).toStrictEqual([
      {
        id: feature.id,
        key: 'feature',
        name: 'Feature',
        type: 0,
        value_flag: true,
        value_limit: null,
      },
    ])
  })

  test('Get customer state should return overridden subscription features', async () => {
    const account = await createAccount()
    const customer = await createStripeCustomer(account.stripeId)
    const trueFeature = await createFlagFeature(
      account.stripeId,
      'Default True',
      'default_true',
      true,
    )
    const falseFeature = await createFlagFeature(
      account.stripeId,
      'Default False',
      'default_false',
      false,
    )
    const limitFeature = await createLimitFeature(
      account.stripeId,
      'Default 20',
      'default_20',
      20,
    )

    await db
      .insert(customerFeatures)
      .values({
        valueFlag: true,
        stripeAccountId: account.stripeId,
        stripeCustomerId: customer.stripeId,
        featureId: falseFeature.id,
      })
      .returning()
    await db
      .insert(customerFeatures)
      .values({
        valueFlag: false,
        stripeAccountId: account.stripeId,
        stripeCustomerId: customer.stripeId,
        featureId: trueFeature.id,
      })
      .returning()
    await db
      .insert(customerFeatures)
      .values({
        valueLimit: null,
        stripeAccountId: account.stripeId,
        stripeCustomerId: customer.stripeId,
        featureId: limitFeature.id,
      })
      .returning()

    const state = await getCustomerFeaturesState(
      account.stripeId,
      customer.stripeId,
    )

    expect(state).toStrictEqual([
      {
        id: trueFeature.id,
        key: 'default_true',
        name: 'Default True',
        type: 0,
        value_flag: false,
        value_limit: null,
      },
      {
        id: falseFeature.id,
        key: 'default_false',
        name: 'Default False',
        type: 0,
        value_flag: true,
        value_limit: null,
      },
      {
        id: limitFeature.id,
        key: 'default_20',
        name: 'Default 20',
        type: 1,
        value_flag: null,
        value_limit: null,
      },
    ])
  })
})

describe('Subscription state', () => {
  test('Get subscription state should return a stripe subscription object', async () => {
    const account = await createAccount()
    const customer = await createStripeCustomer(account.stripeId)
    const product = await createStripeProduct(account.stripeId)
    const price = await createStripePrice(account.stripeId, product.stripeId)
    const sid = genStripeId('sub')
    const siid = genStripeId('si')
    const subscription = await createStripeSubscription(
      account.stripeId,
      customer.stripeId,
      price.stripeId,
      {
        id: sid,
        items: {
          data: [
            {
              id: siid,
              price: {
                id: price.stripeId,
                product: product.stripeId,
              },
            },
          ],
        },
      },
      sid,
      siid,
    )

    const state = await getCustomerSubscriptionsState(
      account.stripeId,
      customer.stripeId,
    )
    expect(state).toStrictEqual([
      {
        id: subscription.stripeId,
        items: {
          data: [
            {
              id: siid,
              price: {
                id: price.stripeId,
                product: {
                  id: product.stripeId,
                },
              },
            },
          ],
        },
      },
    ])
  })
})
