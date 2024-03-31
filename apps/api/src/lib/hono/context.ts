import { Context } from 'hono'
import { MemoryCache } from '@/lib/cache/memory'
import { ZoneCache } from '@/lib/cache/zone'
import { TieredCache } from '@/lib/cache/tiered'
import { Cache, Entry } from '@/lib/cache/interface'
import { HonoEnv } from '@/lib/hono/env'
import { initServices } from '@/lib/services/init'

export function initCacheContext(
  cacheMap: Map<`${string}:${string}`, Entry<unknown>>,
) {
  return async (c: Context<HonoEnv>, next: () => Promise<void>) => {
    let _caches: Cache[] = [new MemoryCache(cacheMap)]
    if (c.env.CLOUDFLARE_API_KEY && c.env.CLOUDFLARE_ZONE_ID) {
      _caches = _caches.concat(
        new ZoneCache({
          domain: 'cache.spackle.so',
          zoneId: c.env.CLOUDFLARE_ZONE_ID,
          cloudflareApiKey: c.env.CLOUDFLARE_API_KEY,
        }),
      )
    }

    const cache = new TieredCache(_caches)
    c.set('cache', cache)
    await next()
  }
}

export function initServiceContext(exemptPaths: string[] = []) {
  return async (c: Context<HonoEnv>, next: () => Promise<void>) => {
    const matchedPaths = c.req.matchedRoutes
      .map((r) => r.path)
      .filter((p) => !p.includes('*'))

    if (matchedPaths.filter((p) => exemptPaths.includes(p)).length) {
      await next()
    } else {
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
      await services.client.end()
    }
  }
}
