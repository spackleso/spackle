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
  const { data: customerData } = (await supabase
    .from('stripe_customers')
    .insert({
      stripe_id: stripeId('cust'),
      stripe_account_id,
    })
    .select()) as any
  return customerData[0]
}

export const createStripeProduct = async (stripe_account_id: string) => {
  const { data } = (await supabase
    .from('stripe_products')
    .insert({
      stripe_account_id,
      stripe_id: stripeId('prod'),
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
