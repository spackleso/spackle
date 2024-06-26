import Stripe from 'stripe'
import postgres from 'postgres'
import { schema } from '@spackle/db'
import { Toucan } from 'toucan-js'
import { drizzle } from 'drizzle-orm/postgres-js'
import { DatabaseService } from '@/lib/services/db'
import { TelemetryService } from '@/lib/services/telemetry'
import { StripeService } from '@/lib/services/stripe'
import { EntitlementsService } from '@/lib/services/entitlements'
import { TokenService } from '@/lib/services/token'
import { BillingService } from '@/lib/services/billing'
import { HonoEnv } from '@/lib/hono/env'
import { SyncService } from './sync'
import { PricingTablesService } from './pricing-tables'
import { Cache } from '@/lib/cache/interface'
import { AnalyticsService } from '@/lib/services/analytics'

export function initServices(
  sentry: Toucan,
  cache: Cache,
  env: HonoEnv['Bindings'],
) {
  const telemetryService = new TelemetryService(
    env.POSTHOG_API_HOST,
    env.POSTHOG_API_KEY,
    sentry,
  )
  const client = postgres(env.DATABASE_URL)
  const db = drizzle(client, { schema })
  const dbService = new DatabaseService(db, telemetryService, env.DB_PK_SALT)
  const liveStripe = new Stripe(env.STRIPE_LIVE_SECRET_KEY, {
    apiVersion: '2022-08-01' as any,
  })
  const testStripe = new Stripe(env.STRIPE_TEST_SECRET_KEY, {
    apiVersion: '2022-08-01' as any,
  })
  const stripeService = new StripeService(
    dbService,
    liveStripe,
    testStripe,
    cache,
  )
  const syncService = new SyncService(
    db,
    dbService,
    env.SYNC,
    sentry,
    stripeService,
  )
  const entitlementsService = new EntitlementsService(db)
  const tokenService = new TokenService(db, env.SUPABASE_JWT_SECRET)
  const analyticsService = new AnalyticsService(
    env.CLOUDFLARE_ACCOUNT_ID,
    env.CLOUDFLARE_API_KEY,
  )
  const billingService = new BillingService(
    db,
    dbService,
    entitlementsService,
    env.BILLING_STRIPE_ACCOUNT_ID,
    env.ENVIRONMENT,
    analyticsService,
  )
  const pricingTablesService = new PricingTablesService(
    db,
    dbService,
    entitlementsService,
  )
  return {
    analyticsService,
    billingService,
    client,
    db,
    dbService,
    entitlementsService,
    liveStripe,
    pricingTablesService,
    stripeService,
    syncService,
    telemetryService,
    testStripe,
    tokenService,
  }
}
