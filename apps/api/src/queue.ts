import { Queue, Worker } from 'bullmq'
import Redis from 'ioredis'
import { storeAccountStates, storeCustomerState } from '@/store/dynamodb'
import { syncAllAccountData } from '@/stripe/sync'

export const redis = new Redis(
  process.env.REDIS_URL || 'redis://localhost:6379',
  {
    maxRetriesPerRequest: null,
  },
)

export const getQueue = (name = 'default') => {
  return new Queue(name, { connection: redis })
}

export const getWorker = (name = 'default') => {
  return new Worker(
    name,
    async (job) => {
      if (job.name === 'syncAllAccountData') {
        await syncAllAccountData(job.data.stripeAccountId)
      } else if (job.name === 'storeAccountStates') {
        await storeAccountStates(job.data.stripeAccountId)
      } else if (job.name === 'storeCustomerState') {
        await storeCustomerState(
          job.data.stripeAccountId,
          job.data.stripeCustomerId,
        )
      }
    },
    { connection: redis },
  )
}
