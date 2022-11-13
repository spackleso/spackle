/**
 * @jest-environment node
 */

import { Redis } from '@upstash/redis'
import {
  invalidateAccountCustomerStates,
  invalidateCustomerState,
} from './cache'

const url = process.env.UPSTASH_REDIS_REST_URL || ''
const token = process.env.UPSTASH_REDIS_REST_TOKEN || ''

const initializeTestCache = async () => {
  const redis = new Redis({ url, token })
  const keys = await redis.keys('*')
  await redis.del(...keys)
}

beforeAll(async () => {
  await initializeTestCache()
})

test('invalidateAccountCustomerStates should evict all account keys from redis', async () => {
  const account_id = 'acct_123'
  const keys = [
    `${account_id}:customer_state:cus_123`,
    `${account_id}:customer_state:cus_456`,
  ]
  const otherKey = `acct_456:customer_state:cus_123`
  const data = { test: '123' }

  const redis = new Redis({ url, token })
  for (let key of keys) {
    await redis.set(key, JSON.stringify(data))
  }
  await redis.set(otherKey, JSON.stringify(data))

  for (let key of keys) {
    expect(await redis.get(key)).toEqual(data)
  }
  expect(await redis.get(otherKey)).toEqual(data)
  await invalidateAccountCustomerStates(account_id)
  for (let key of keys) {
    expect(await redis.get(key)).toEqual(null)
  }
  expect(await redis.get(otherKey)).toEqual(data)
})

test('invalidateCustomerState should evict customer key from redis', async () => {
  const account_id = 'acct_123'
  const customer_id = 'cus_123'
  const key = `${account_id}:customer_state:${customer_id}`
  const otherKey = `${account_id}:customer_state:cus_456`
  const data = { test: '123' }

  const redis = new Redis({ url, token })
  await redis.set(key, JSON.stringify(data))
  await redis.set(otherKey, JSON.stringify(data))

  expect(await redis.get(key)).toEqual(data)
  expect(await redis.get(otherKey)).toEqual(data)
  await invalidateCustomerState(account_id, customer_id)
  expect(await redis.get(key)).toEqual(null)
  expect(await redis.get(otherKey)).toEqual(data)
})
