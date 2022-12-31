import crypto from 'crypto'
import { execSync } from 'child_process'
import {
  getAccountFeaturesState,
  getCustomerFeaturesState,
  getCustomerState,
  getPriceFeaturesState,
  getProductFeaturesState,
} from './state'
import { supabase } from './supabase'

const stripeId = (prefix: string) => {
  return `${prefix}_${crypto.randomBytes(16).toString('hex')}`
}

const initializeTestDatabase = async () => {
  execSync('supabase db reset')
}

beforeAll(async () => {
  await initializeTestDatabase()
})

test('Get accounts state should return all account features', async () => {
  const { data } = (await supabase
    .from('stripe_accounts')
    .insert({
      stripe_id: stripeId('acct'),
    })
    .select()) as any
  const account = data[0]

  const { data: featureData } = (await supabase
    .from('features')
    .insert({
      name: 'Feature',
      key: 'feature',
      type: 0,
      value_flag: false,
      stripe_account_id: account.stripe_id,
    })
    .select()) as any
  const feature = featureData[0]

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
  const { data: accountData } = (await supabase
    .from('stripe_accounts')
    .insert({
      stripe_id: stripeId('acct'),
    })
    .select()) as any
  const account = accountData[0]

  const { data: featureData } = (await supabase
    .from('features')
    .insert({
      name: 'Feature',
      key: 'feature',
      type: 0,
      value_flag: false,
      stripe_account_id: account.stripe_id,
    })
    .select()) as any
  const feature = featureData[0]

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
  const { data: accountData } = (await supabase
    .from('stripe_accounts')
    .insert({
      stripe_id: stripeId('acct'),
    })
    .select()) as any
  const account = accountData[0]

  const { data: featureData } = (await supabase
    .from('features')
    .insert({
      name: 'Feature',
      key: 'feature',
      type: 0,
      value_flag: false,
      stripe_account_id: account.stripe_id,
    })
    .select()) as any
  const feature = featureData[0]

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
  const { data: accountData } = (await supabase
    .from('stripe_accounts')
    .insert({
      stripe_id: stripeId('acct'),
    })
    .select()) as any
  const account = accountData[0]

  const { data: customerData } = (await supabase
    .from('stripe_customers')
    .insert({
      stripe_id: stripeId('acct'),
      stripe_account_id: account.stripe_id,
    })
    .select()) as any
  const customer = customerData[0]

  const { data: trueFeatureData } = await supabase
    .from('features')
    .insert({
      name: 'Default True',
      key: 'default_true',
      type: 0,
      value_flag: true,
      stripe_account_id: account.stripe_id,
    })
    .select()
  const trueFeature = trueFeatureData![0]

  const { data: falseFeatureData } = await supabase
    .from('features')
    .insert({
      name: 'Default False',
      key: 'default_false',
      type: 0,
      value_flag: false,
      stripe_account_id: account.stripe_id,
    })
    .select()
  const falseFeature = falseFeatureData![0]

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
  ])
})