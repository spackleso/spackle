import { Queue } from '../lib/queue/queue'
import { DatabaseService } from '@/lib/services/db'
import { StripeService } from '@/lib/services/stripe'
import { TelemetryService } from '@/lib/services/telemetry'
import { Toucan } from 'toucan-js'
import { schema } from '@spackle/db'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import Stripe from 'stripe'

const sentry = new Toucan({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0,
  enabled: process.env.ENVIRONMENT !== 'development',
})
const client = postgres(process.env.DATABASE_URL!)
const db = drizzle(client, { schema })
const telemetryService = new TelemetryService(
  'https://app.posthog.com',
  process.env.POSTHOG_API_KEY!,
  sentry,
)
const dbService = new DatabaseService(
  db,
  telemetryService,
  process.env.DB_PK_SALT!,
)
const liveStripe = new Stripe(process.env.STRIPE_LIVE_SECRET_KEY!, {
  apiVersion: '2022-08-01' as any,
})
const testStripe = new Stripe(process.env.STRIPE_TEST_SECRET_KEY!, {
  apiVersion: '2022-08-01' as any,
})
const stripeService = new StripeService(
  db,
  dbService,
  liveStripe,
  testStripe,
  sentry,
)
const queue = new Queue(process.env.REDIS_URL!, stripeService)

console.info('Starting worker...')
const worker = queue.getWorker()

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

  sentry.setContext('job', {
    id: job?.id,
    name: job?.name,
    data: job?.data,
  })
  sentry.captureException(err)
})
