import {
  getAccountFeaturesState,
  getCustomerFeaturesState,
  getCustomerSubscriptionsState,
  getPriceFeaturesState,
  getProductFeaturesState,
} from './state'
import supabase from 'spackle-supabase'
import {
  createAccount,
  createStripeCustomer,
  createFlagFeature,
  createLimitFeature,
  stripeId,
  createStripeProduct,
  createStripePrice,
  createStripeSubscription,
} from '@/tests/helpers'

describe('Features state', () => {
  test('Get accounts state should return all account features', async () => {
    const account = await createAccount()
    const feature = await createFlagFeature(
      account.stripe_id,
      'Feature',
      'feature',
      false,
    )
    const state = await getAccountFeaturesState(account.stripe_id)
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
      account.stripe_id,
      'Feature',
      'feature',
      false,
    )

    const { data: productData } = (await supabase
      .from('stripe_products')
      .insert({
        stripe_id: stripeId('prod'),
        stripe_account_id: account.stripe_id,
      })
      .select()) as any
    const product = productData[0]

    await supabase.from('product_features').insert({
      value_flag: true,
      stripe_account_id: account.stripe_id,
      stripe_product_id: product.stripe_id,
      feature_id: feature.id,
    })

    const state = await getProductFeaturesState(
      account.stripe_id,
      product.stripe_id,
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
      account.stripe_id,
      'Feature',
      'feature',
      false,
    )

    const { data: productData } = (await supabase
      .from('stripe_products')
      .insert({
        stripe_id: stripeId('prod'),
        stripe_account_id: account.stripe_id,
      })
      .select()) as any
    const product = productData[0]

    const { data: priceData } = (await supabase
      .from('stripe_prices')
      .insert({
        stripe_id: stripeId('price'),
        stripe_account_id: account.stripe_id,
        stripe_product_id: product.stripe_id,
      })
      .select()) as any
    const price = priceData[0]

    await supabase.from('price_features').insert({
      value_flag: true,
      stripe_account_id: account.stripe_id,
      stripe_price_id: price.stripe_id,
      feature_id: feature.id,
    })

    const state = await getPriceFeaturesState(
      account.stripe_id,
      product.stripe_id,
      price.stripe_id,
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
    const customer = await createStripeCustomer(account.stripe_id)
    const trueFeature = await createFlagFeature(
      account.stripe_id,
      'Default True',
      'default_true',
      true,
    )
    const falseFeature = await createFlagFeature(
      account.stripe_id,
      'Default False',
      'default_false',
      false,
    )
    const limitFeature = await createLimitFeature(
      account.stripe_id,
      'Default 20',
      'default_20',
      20,
    )

    await supabase.from('customer_features').insert({
      value_flag: true,
      stripe_account_id: account.stripe_id,
      stripe_customer_id: customer.stripe_id,
      feature_id: falseFeature.id,
    })
    await supabase.from('customer_features').insert({
      value_flag: false,
      stripe_account_id: account.stripe_id,
      stripe_customer_id: customer.stripe_id,
      feature_id: trueFeature.id,
    })
    await supabase.from('customer_features').insert({
      value_limit: null,
      stripe_account_id: account.stripe_id,
      stripe_customer_id: customer.stripe_id,
      feature_id: limitFeature.id,
    })

    const state = await getCustomerFeaturesState(
      account.stripe_id,
      customer.stripe_id,
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
    const customer = await createStripeCustomer(account.stripe_id)
    const product = await createStripeProduct(account.stripe_id)
    const price = await createStripePrice(account.stripe_id, product.stripe_id)
    const sid = stripeId('sub')
    const siid = stripeId('si')
    const subscription = await createStripeSubscription(
      account.stripe_id,
      customer.stripe_id,
      price.stripe_id,
      JSON.stringify({
        id: sid,
        items: {
          data: [
            {
              id: siid,
              price: {
                id: price.stripe_id,
                product: product.stripe_id,
              },
            },
          ],
        },
      }),
      sid,
      siid,
    )

    const state = await getCustomerSubscriptionsState(
      account.stripe_id,
      customer.stripe_id,
    )
    expect(state).toStrictEqual([
      {
        id: subscription.stripe_id,
        items: {
          data: [
            {
              id: siid,
              price: {
                id: price.stripe_id,
                product: {
                  id: product.stripe_id,
                },
              },
            },
          ],
        },
      },
    ])
  })
})
