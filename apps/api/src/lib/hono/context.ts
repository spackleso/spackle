import { Context } from 'hono'
import { MemoryCache } from '@/lib/cache/memory'
import { ZoneCache } from '@/lib/cache/zone'
import { TieredCache } from '@/lib/cache/tiered'
import { Cache, Entry } from '@/lib/cache/interface'
import { HonoEnv } from '@/lib/hono/env'
import { initServices } from '@/lib/services/init'
import { CacheWithTracing } from '@/lib/cache/tracing'
import { trace } from '@opentelemetry/api'

export function initCacheContext(
  cacheMap: Map<`${string}:${string}`, Entry<unknown>>,
) {
  const tracer = trace.getTracer('init')
  return async (c: Context<HonoEnv>, next: () => Promise<void>) => {
    const span = tracer.startSpan('initCacheContext')
    let _caches: Cache[] = [CacheWithTracing.wrap(new MemoryCache(cacheMap))]
    if (c.env.CLOUDFLARE_API_KEY && c.env.CLOUDFLARE_ZONE_ID) {
      _caches = _caches.concat(
        CacheWithTracing.wrap(
          new ZoneCache({
            domain: 'cache.spackle.so',
            zoneId: c.env.CLOUDFLARE_ZONE_ID,
            cloudflareApiKey: c.env.CLOUDFLARE_API_KEY,
          }),
        ),
      )
    }

    const cache = new TieredCache(_caches)
    c.set('cache', cache)
    span.end()
    await next()
  }
}

export function initServiceContext(exemptPaths: string[] = []) {
  const tracer = trace.getTracer('init')
  return async (c: Context<HonoEnv>, next: () => Promise<void>) => {
    const span = tracer.startSpan('initServiceContext')
    const matchedPaths = c.req.matchedRoutes
      .map((r) => r.path)
      .filter((p) => !p.includes('*'))

    if (matchedPaths.filter((p) => exemptPaths.includes(p)).length) {
      return next()
    }

    const services = initServices(c.get('sentry'), c.env)
    c.set('telemetry', services.telemetryService)
    c.set('db', services.db)
    c.set('dbService', services.dbService)
    c.set('liveStripe', services.liveStripe)
    c.set('testStripe', services.testStripe)
    c.set('stripeService', services.stripeService)
    c.set('syncService', services.syncService)
    c.set('entitlementsService', services.entitlementsService)
    c.set('tokenService', services.tokenService)
    c.set('billingService', services.billingService)
    c.set('pricingTablesService', services.pricingTablesService)

    await next()
    span.end()
    await services.client.end()
  }
}
