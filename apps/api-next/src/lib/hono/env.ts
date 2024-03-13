import { Database } from '@spackle/db'
import { TieredCache } from '@/lib/cache/tiered'
import { DatabaseService } from '@/lib/db/service'
import { Toucan } from 'toucan-js'
import { TelemetryService } from '@/lib/telemetry/service'
import Stripe from 'stripe'
import { StripeService } from '../stripe/service'

export type HonoEnv = {
  Bindings: {
    DATABASE_URL: string
    ENVIRONMENT: string
    ORIGIN: string
    POSTHOG_API_HOST: string
    POSTHOG_API_KEY: string
    SENTRY_DSN: string
    STRIPE_LIVE_SECRET_KEY: string
    STRIPE_SIGNING_SECRET: string
    STRIPE_TEST_SECRET_KEY: string
  }
  Variables: {
    cache: TieredCache
    db: Database
    dbService: DatabaseService
    liveStripe: Stripe
    sentry: Toucan
    telemetry: TelemetryService
    testStripe: Stripe
    stripeService: StripeService
  }
}
