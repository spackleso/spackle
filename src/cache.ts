import { Redis } from '@upstash/redis'

const url = process.env.UPSTASH_REDIS_REST_URL
const token = process.env.UPSTASH_REDIS_REST_TOKEN

export const invalidateAccountCustomerStates = async (
  stripeAccountId: string,
) => {
  if (!url || !token) {
    return
  }

  const redis = new Redis({ url, token })
  const keys = await redis.keys(`${stripeAccountId}:customer_state:*`)
  await redis.del(...keys)
}

export const invalidateCustomerState = async (
  stripeAccountId: string,
  stripeCustomerId: string,
) => {
  if (!url || !token) {
    return
  }

  const redis = new Redis({ url, token })
  await redis.del(`${stripeAccountId}:customer_state:${stripeCustomerId}`)
}
