import { logger } from '@/logger'
import * as Sentry from '@sentry/node'
import { getWorker } from '@/queue'

const SENTRY_DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN

Sentry.init({
  dsn: SENTRY_DSN || '',
  tracesSampleRate: 0,
  enabled: process.env.NODE_ENV === 'production',
})

export const start = () => {
  logger.info('Starting worker...')
  const worker = getWorker()

  worker.on('completed', (job) => {
    logger.info(`${job.id} has completed!`)
  })

  worker.on('failed', (job, err) => {
    logger.error(`Job ${job?.id} has failed: ${err.message}`, err)
    Sentry.captureException(err, {
      extra: {
        job: {
          id: job?.id,
          name: job?.name,
          data: job?.data,
        },
      },
    })
  })
}
