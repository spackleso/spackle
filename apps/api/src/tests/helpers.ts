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
