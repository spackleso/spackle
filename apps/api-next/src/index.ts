import { Context } from 'hono'
import { MemoryCache } from '@/lib/cache/memory'
import { PersistentCache } from '@/lib/cache/persistent'
import { TieredCache } from '@/lib/cache/tiered'
import { StatusCode } from 'hono/utils/http-status'
import { cors } from 'hono/cors'
import { sentry } from '@hono/sentry'
import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import stripe from '@/routes/stripe'
import v1 from '@/routes/v1'
import { schema } from '@spackle/db'
import { OpenAPIHono } from '@hono/zod-openapi'
import { DatabaseService } from '@/lib/services/db'
import { TelemetryService } from '@/lib/services/telemetry'
import { App, HonoEnv, Job } from '@/lib/hono/env'
import { StripeService } from '@/lib/services/stripe'
import Stripe from 'stripe'
import { EntitlementsService } from './lib/services/entitlements'
import { TokenService } from './lib/services/token'
import { BillingService } from './lib/services/billing'
import { Cache } from './lib/cache/interface'
import { Toucan } from 'toucan-js'

const cacheMap = new Map()

function initServices(sentry: Toucan, env: HonoEnv['Bindings']) {
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

function initContext() {
  let _caches: Cache[] = [new MemoryCache(cacheMap)]
  if (typeof caches !== 'undefined') {
    _caches = _caches.concat(new PersistentCache())
  }

  const cache = new TieredCache(_caches)
  return async (c: Context<HonoEnv>, next: () => Promise<void>) => {
    c.set('cache', cache)

    const services = initServices(c.get('sentry'), c.env)
    c.set('telemetry', services.telemetryService)
    c.set('db', services.db)
    c.set('dbService', services.dbService)
    c.set('liveStripe', services.liveStripe)
    c.set('testStripe', services.testStripe)
    c.set('stripeService', services.stripeService)
    c.set('entitlementsService', services.entitlementsService)
    c.set('tokenService', services.tokenService)
    c.set('billingService', services.billingService)

    await next()
    await services.client.end()
  }
}

const app = new OpenAPIHono<HonoEnv>() as App

app.use('*', cors())
app.use('*', (c, next) => {
  return sentry({
    enabled: !!c.env.SENTRY_DSN,
  })(c, next)
})
app.use('*', initContext())

app.route('/stripe', stripe)
app.route('/v1', v1)
app.route('/', v1)
app.doc('/openapi.json', {
  openapi: '3.0.0',
  info: {
    version: '1.0.0',
    title: 'Spackle API',
  },
})

app.all('/*', async (c: Context<HonoEnv>) => {
  // Proxy all other requests to the origin
  const url = `${c.env.ORIGIN}${c.req.path}`
  console.log('Proxying request to', url)
  const res = await fetch(`${c.env.ORIGIN}${c.req.path}`, {
    headers: c.req.raw.headers,
    body: c.req.raw.body,
    method: c.req.method,
  })
  c.status(res.status as StatusCode)
  if (res.headers.get('Content-Type') === 'application/json') {
    return c.json(await res.json())
  } else if (res.headers.get('Content-Type') === 'text/html') {
    return c.html(await res.text())
  } else {
    return c.text(await res.text())
  }
})

app.queue = async (batch: MessageBatch<Job>, env: HonoEnv['Bindings']) => {
  const sentry = new Toucan({
    dsn: env.SENTRY_DSN,
    enabled: !!env.SENTRY_DSN,
  })
  const services = initServices(sentry, env)
  for (const message of batch.messages) {
    const { type, payload } = message.body
    switch (type) {
      case 'syncAllAccountData': {
        await services.stripeService.syncAllAccountData(payload.stripeAccountId)
        break
      }
    }
  }
}

export default app
