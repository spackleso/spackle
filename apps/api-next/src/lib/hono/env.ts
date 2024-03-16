import { Database } from '@spackle/db'
import { TieredCache } from '@/lib/cache/tiered'
import { DatabaseService } from '@/lib/db/service'
import { Toucan } from 'toucan-js'
import { TelemetryService } from '@/lib/telemetry/service'
import Stripe from 'stripe'
import { StripeService } from '../stripe/service'
import { EntitlementsService } from '../entitlements/service'

export type HonoEnv = {
  Bindings: {
    BILLING_STRIPE_ACCOUNT_ID: string
    DATABASE_URL: string
    DB_PK_SALT: string
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
    entitlements: EntitlementsService
    liveStripe: Stripe
    sentry: Toucan
    telemetry: TelemetryService
    testStripe: Stripe
    stripeService: StripeService
  }
}
