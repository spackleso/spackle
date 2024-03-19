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
import { HonoEnv } from '@/lib/hono/env'
import { StripeService } from '@/lib/services/stripe'
import Stripe from 'stripe'
import { EntitlementsService } from './lib/services/entitlements'
import { TokenService } from './lib/services/token'
import { BillingService } from './lib/services/billing'
import { Cache } from './lib/cache/interface'

const cacheMap = new Map()

function init() {
  let _caches: Cache[] = [new MemoryCache(cacheMap)]
  if (typeof caches !== 'undefined') {
    _caches = _caches.concat(new PersistentCache())
  }

  const cache = new TieredCache(_caches)
  return async (c: Context<HonoEnv>, next: () => Promise<void>) => {
    c.set('cache', cache)

    const telemetry = new TelemetryService(
      c.env.POSTHOG_API_HOST,
      c.env.POSTHOG_API_KEY,
      c.get('sentry'),
    )
    c.set('telemetry', telemetry)

    const client = postgres(c.env.DATABASE_URL)
    const db = drizzle(client, { schema })
    c.set('db', db)

    const dbService = new DatabaseService(db, telemetry, c.env.DB_PK_SALT)
    c.set('dbService', dbService)

    const liveStripe = new Stripe(c.env.STRIPE_LIVE_SECRET_KEY, {
      apiVersion: '2022-08-01' as any,
    })
    c.set('liveStripe', liveStripe)

    const testStripe = new Stripe(c.env.STRIPE_TEST_SECRET_KEY, {
      apiVersion: '2022-08-01' as any,
    })
    c.set('testStripe', testStripe)

    const stripeService = new StripeService(
      db,
      dbService,
      liveStripe,
      testStripe,
      c.get('sentry'),
    )
    c.set('stripeService', stripeService)
    const entitlementsService = new EntitlementsService(db)
    c.set('entitlementsService', entitlementsService)
    c.set('tokenService', new TokenService(db, c.env.SUPABASE_JWT_SECRET))
    c.set(
      'billingService',
      new BillingService(
        db,
        dbService,
        entitlementsService,
        c.env.BILLING_STRIPE_ACCOUNT_ID,
      ),
    )

    await next()
    await client.end()
  }
}

const app = new OpenAPIHono<HonoEnv>()
app.use('*', cors())
app.use('*', (c, next) => {
  return sentry({
    enabled: !!c.env.SENTRY_DSN,
  })(c, next)
})
app.use('*', init())

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

export default app
