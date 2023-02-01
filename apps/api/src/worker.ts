import * as Sentry from '@sentry/node'
import { getWorker } from '@/queue'

const SENTRY_DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN

Sentry.init({
  dsn: SENTRY_DSN || '',
  tracesSampleRate: 0,
  enabled: process.env.NODE_ENV === 'production',
})

export const start = () => {
  console.info('Starting worker...')
  const worker = getWorker()

  worker.on('completed', (job) => {
    console.info(`Job ${job.id} (${job.name}) has completed`, {
      job: {
        id: job.id,
        name: job.name,
        data: job.data,
      },
    })
  })

  worker.on('failed', (job, err) => {
    console.error(`Job ${job?.id} (${job?.name}) has failed ${err.message}`, {
      job: {
        id: job?.id,
        name: job?.name,
        data: job?.data,
      },
      error: err,
    })

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
