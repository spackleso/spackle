import crypto from 'crypto'
import { execSync } from 'child_process'
import supabase from 'spackle-supabase'
import { createToken } from '@/api'

export const initializeTestDatabase = async () => {
  execSync('supabase db reset')
}

export const stripeId = (prefix: string) => {
  return `${prefix}_${crypto.randomBytes(16).toString('hex')}`
}

export const createAccount = async () => {
  const { data } = (await supabase
    .from('stripe_accounts')
    .insert({
      stripe_id: stripeId('acct'),
    })
    .select()) as any

  return data[0]
}

export const createStripeCustomer = async (stripe_account_id: string) => {
  const stripe_id = stripeId('cust')
  const { data: customerData } = (await supabase
    .from('stripe_customers')
    .insert({
      stripe_id,
      stripe_account_id,
      stripe_json: JSON.stringify({
        id: stripe_id,
      }),
    })
    .select()) as any
  return customerData[0]
}

export const createStripeProduct = async (stripe_account_id: string) => {
  const stripe_id = stripeId('prod')
  const { data } = (await supabase
    .from('stripe_products')
    .insert({
      stripe_account_id,
      stripe_id,
      stripe_json: JSON.stringify({
        id: stripe_id,
      }),
    })
    .select()) as any

  return data[0]
}

export const createStripePrice = async (
  stripe_account_id: string,
  stripe_product_id: string,
) => {
  const stripe_id = stripeId('price')
  const { data } = (await supabase
    .from('stripe_prices')
    .insert({
      stripe_account_id,
      stripe_product_id,
      stripe_id,
      stripe_json: JSON.stringify({
        id: stripe_id,
      }),
    })
    .select()) as any

  return data[0]
}

export const createAccountWithToken = async () => {
  const account = await createAccount()

  const { data: tokenData } = await createToken(account.stripe_id)
  const token = tokenData[0]

  return {
    account,
    token,
  }
}

export const createStripeSubscription = async (
  stripe_account_id: string,
  stripe_customer_id: string,
  stripe_price_id: string,
  stripe_json: string,
  stripe_id: string = stripeId('sub'),
  si_id: string = stripeId('si'),
) => {
  const { data } = (await supabase
    .from('stripe_subscriptions')
    .insert({
      status: 'active',
      stripe_account_id,
      stripe_customer_id,
      stripe_id,
      stripe_json: stripe_json,
    })
    .select()) as any

  await supabase.from('stripe_subscription_items').insert({
    stripe_account_id,
    stripe_id: si_id,
    stripe_price_id,
    stripe_subscription_id: data[0].stripe_id,
  })

  return data[0]
}

export const createFlagFeature = async (
  stripe_account_id: string,
  name: string,
  key: string,
  value_flag: boolean,
) => {
  const { data: featureData } = (await supabase
    .from('features')
    .insert({
      name,
      key,
      type: 0,
      value_flag,
      stripe_account_id,
    })
    .select()) as any
  return featureData[0]
}

export const createLimitFeature = async (
  stripe_account_id: string,
  name: string,
  key: string,
  value_limit: number,
) => {
  const { data: featureData } = (await supabase
    .from('features')
    .insert({
      name,
      key,
      type: 1,
      value_limit,
      stripe_account_id,
    })
    .select()) as any
  return featureData[0]
}

export const createProductFeature = async (
  stripe_account_id: string,
  name: string,
  key: string,
  value_flag: boolean,
) => {
  const feature = await createFlagFeature(
    stripe_account_id,
    name,
    key,
    value_flag,
  )
  const product = await createStripeProduct(stripe_account_id)
  const { data: productFeatureData } = (await supabase
    .from('product_features')
    .insert({
      stripe_account_id,
      feature_id: feature.id,
      stripe_product_id: product.stripe_id,
      value_flag,
    })
    .select()) as any
  return productFeatureData[0]
}

export const createPriceFeature = async (
  stripe_account_id: string,
  name: string,
  key: string,
  value_flag: boolean,
) => {
  const feature = await createFlagFeature(
    stripe_account_id,
    name,
    key,
    value_flag,
  )
  const product = await createStripeProduct(stripe_account_id)
  const price = await createStripePrice(stripe_account_id, product.stripe_id)
  const { data: priceFeatureData } = (await supabase
    .from('price_features')
    .insert({
      stripe_account_id,
      feature_id: feature.id,
      stripe_price_id: price.stripe_id,
      value_flag,
    })
    .select()) as any
  return priceFeatureData[0]
}

export const createCustomerFeature = async (
  stripe_account_id: string,
  name: string,
  key: string,
  value_flag: boolean,
) => {
  const feature = await createFlagFeature(
    stripe_account_id,
    name,
    key,
    value_flag,
  )
  const customer = await createStripeCustomer(stripe_account_id)
  const { data: customerFeatureData } = (await supabase
    .from('customer_features')
    .insert({
      stripe_account_id,
      feature_id: feature.id,
      stripe_customer_id: customer.stripe_id,
      value_flag,
    })
    .select()) as any
  return customerFeatureData[0]
}
