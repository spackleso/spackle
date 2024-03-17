import { Database } from '@spackle/db'
import { TieredCache } from '@/lib/cache/tiered'
import { DatabaseService } from '@/lib/services/db'
import { Toucan } from 'toucan-js'
import { TelemetryService } from '@/lib/services/telemetry'
import Stripe from 'stripe'
import { StripeService } from '../services/stripe'
import { EntitlementsService } from '../services/entitlements'
import { TokenService } from '../services/token'
import { BillingService } from '../services/billing'

export type HonoEnv = {
  Bindings: {
    BILLING_ENTITLEMENTS_PRICE_ID: string
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
    SUPABASE_JWT_SECRET: string
  }
  Variables: {
    cache: TieredCache
    billingService: BillingService
    db: Database
    dbService: DatabaseService
    entitlementsService: EntitlementsService
    liveStripe: Stripe
    sentry: Toucan
    stripeService: StripeService
    telemetry: TelemetryService
    testStripe: Stripe
    tokenService: TokenService
  }
}
