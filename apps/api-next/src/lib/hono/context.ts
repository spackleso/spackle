import { Context } from 'hono'
import { MemoryCache } from '@/lib/cache/memory'
import { PersistentCache } from '@/lib/cache/persistent'
import { TieredCache } from '@/lib/cache/tiered'
import { Cache, Entry } from '@/lib/cache/interface'
import { HonoEnv } from '@/lib/hono/env'
import { initServices } from '@/lib/services/init'

export function initContext(
  cacheMap: Map<`${string}:${string}`, Entry<unknown>>,
) {
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
