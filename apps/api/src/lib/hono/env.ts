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
import { OpenAPIHono } from '@hono/zod-openapi'
import { SyncService } from '../services/sync'
import { PricingTablesService } from '../services/pricing-tables'
import { Metrics } from '../metrics'

export type Job = {
  type: string
  payload: any
}

export type App = OpenAPIHono<HonoEnv> & {
  queue: (batch: MessageBatch<Job>, env: HonoEnv['Bindings']) => Promise<void>
}

export type HonoEnv = {
  Bindings: {
    AXIOM_API_TOKEN: string
    AXIOM_DATASET: string
    BILLING_ENTITLEMENTS_PRICE_ID: string
    BILLING_STRIPE_ACCOUNT_ID: string
    CLOUDFLARE_API_KEY: string
    CLOUDFLARE_ZONE_ID: string
    DATABASE_URL: string
    DB_PK_SALT: string
    ENVIRONMENT: string
    HOST: string
    POSTHOG_API_HOST: string
    POSTHOG_API_KEY: string
    POSTMARK_API_KEY: string
    POSTMARK_FROM_EMAIL: string
    REDIS_URL: string
    SENTRY_DSN: string
    STRIPE_APP_ID: string
    STRIPE_BILLING_WEBHOOK_SECRET: string
    STRIPE_CONNECTED_WEBHOOK_SECRET: string
    STRIPE_LIVE_SECRET_KEY: string
    STRIPE_SIGNING_SECRET: string
    STRIPE_TEST_SECRET_KEY: string
    SUPABASE_JWT_SECRET: string
    SYNC: Queue<Job>
    VERSION: string
    WEB_HOST: string
  }
  Variables: {
    cache: TieredCache
    billingService: BillingService
    db: Database
    dbService: DatabaseService
    entitlementsService: EntitlementsService
    liveStripe: Stripe
    metrics: Metrics
    pricingTablesService: PricingTablesService
    requestId: string
    sentry: Toucan
    stripeService: StripeService
    syncService: SyncService
    telemetry: TelemetryService
    testStripe: Stripe
    tokenService: TokenService
  }
}

export type APIHonoEnv = HonoEnv & {
  Variables: HonoEnv['Variables'] & {
    token: {
      sub: string
      publishable: boolean
    }
  }
}
