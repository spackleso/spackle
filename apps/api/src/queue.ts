import { Queue, Worker } from 'bullmq'
import Redis from 'ioredis'
import { storeAccountStates } from '@/store/dynamodb'
import { syncAllAccountData } from '@/stripe/sync'

const getConnection = () => {
  return new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: null,
  })
}

export const getQueue = (name = 'default') => {
  const connection = getConnection()
  return new Queue(name, { connection })
}

export const getWorker = (name = 'default') => {
  const connection = getConnection()
  return new Worker(
    name,
    async (job) => {
      if (job.name === 'syncAllAccountData') {
        await syncAllAccountData(job.data.account_id)
      } else if ((job.name = 'storeAccountStates')) {
        await storeAccountStates(job.data.account_id)
      }
    },
    { connection },
  )
}
