import { Queue as BullQueue, Worker as BullWorker, Job } from 'bullmq'
import Redis from 'ioredis'
import { StripeService } from '@/lib/services/stripe'

export class Queue {
  redis: Redis
  stripeService: StripeService

  constructor(redisUrl: string, stripeService: StripeService) {
    this.redis = new Redis(redisUrl, {
      maxRetriesPerRequest: null,
    })
    this.stripeService = stripeService
  }

  getQueue(name = 'default') {
    return new BullQueue(name, { connection: this.redis })
  }

  getWorker(name = 'default') {
    return new BullWorker(
      name,
      async (job: Job) => {
        if (job.name === 'syncAllAccountData') {
          await this.stripeService.syncAllAccountData(job.data.stripeAccountId)
        }
      },
      { connection: this.redis },
    )
  }
}
