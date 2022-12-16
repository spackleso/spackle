import Redis from 'ioredis'

// Since we are running in a serverless environment, redis connections should be
// made lazily. Otherwise, we risk running out of connections.
export const getClient = () => {
  return new Redis(process.env.UPSTASH_REDIS_URL || '')
}
