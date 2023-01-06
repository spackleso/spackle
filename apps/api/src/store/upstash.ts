import { Redis } from '@upstash/redis'
import { getCustomerFeaturesState, getCustomerState } from '@/state'
import supabase, { SupabaseError } from 'spackle-supabase'

const url = process.env.UPSTASH_REDIS_REST_URL || ''
const token = process.env.UPSTASH_REDIS_REST_TOKEN || ''
const redis = new Redis({ url, token })

export const customerKey = (
  stripeAccountId: string,
  stripeCustomerId: string,
) => {
  return `${stripeAccountId}:customer_state:${stripeCustomerId}`
}

export const storeAccountStates = async (stripeAccountId: string) => {
  const p = redis.pipeline()
  const { data, error } = await supabase
    .from('stripe_customers')
    .select('stripe_id')
    .eq('stripe_account_id', stripeAccountId)

  if (error) {
    throw new SupabaseError(error)
  }

  for (let { stripe_id } of data) {
    const state = await getCustomerFeaturesState(stripeAccountId, stripe_id)
    p.set(customerKey(stripeAccountId, stripe_id), state)
  }
  await p.exec()
}

export const storeAccountStatesAsync = async (stripeAccountId: string) => {
  const { BACKGROUND_API_TOKEN, HOST } = process.env
  await fetch(
    `${HOST}/.netlify/functions/store_account_states-background?stripe_account_id=${stripeAccountId}`,
    {
      headers: {
        authorization: `Token ${BACKGROUND_API_TOKEN}`,
      },
    },
  )
}

export const storeCustomerState = async (
  stripeAccountId: string,
  stripeCustomerId: string,
) => {
  const state = await getCustomerState(stripeAccountId, stripeCustomerId)
  await redis.set(customerKey(stripeAccountId, stripeCustomerId), state)
}
