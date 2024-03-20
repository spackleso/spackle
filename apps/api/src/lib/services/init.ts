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

export function initServices(sentry: Toucan, env: HonoEnv['Bindings']) {
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
    db,
    dbService,
    liveStripe,
    testStripe,
    sentry,
    env.SYNC,
  )
  const entitlementsService = new EntitlementsService(db)
  const tokenService = new TokenService(db, env.SUPABASE_JWT_SECRET)
  const billingService = new BillingService(
    db,
    dbService,
    entitlementsService,
    env.BILLING_STRIPE_ACCOUNT_ID,
  )
  return {
    billingService,
    client,
    db,
    dbService,
    entitlementsService,
    liveStripe,
    stripeService,
    telemetryService,
    testStripe,
    tokenService,
  }
}
