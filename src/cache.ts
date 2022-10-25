import { Redis } from '@upstash/redis'

const url = process.env.UPSTASH_REDIS_REST_URL
const token = process.env.UPSTASH_REDIS_REST_TOKEN

export const invalidateAccountCustomerStates = async (accountId: string) => {
  if (!url || !token) {
    return
  }

  const redis = new Redis({ url, token })
  await redis.del(`${accountId}:customer_state:*`)
}

export const invalidateCustomerState = async (
  accountId: string,
  customerId: string,
) => {
  if (!url || !token) {
    return
  }

  const redis = new Redis({ url, token })
  await redis.del(`${accountId}:customer_state:${customerId}`)
}
