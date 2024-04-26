import { MemoryCache } from '@/lib/cache/memory'
import { ZoneCache } from '@/lib/cache/zone'
import { TieredCache } from '@/lib/cache/tiered'
import { Cache } from '@/lib/cache'
import { CacheWithTracing } from '@/lib/cache/tracing'
import { CacheWithMetrics } from '@/lib/cache/metrics'
import { HonoEnv } from '@/lib/hono/env'
import { Metrics } from '@/lib/metrics'

const cacheMap = new Map()

export function initCache(env: HonoEnv['Bindings'], metrics: Metrics) {
  let _caches: Cache[] = []

  if (env.CLOUDFLARE_API_KEY && env.CLOUDFLARE_ZONE_ID) {
    _caches = _caches.concat(
      CacheWithMetrics.wrap(
        CacheWithTracing.wrap(
          new ZoneCache({
            domain: 'cache.spackle.so',
            zoneId: env.CLOUDFLARE_ZONE_ID,
            cloudflareApiKey: env.CLOUDFLARE_API_KEY,
          }),
        ),
        metrics,
      ),
    )
  } else {
    _caches = _caches.concat(
      CacheWithMetrics.wrap(
        CacheWithTracing.wrap(new MemoryCache(cacheMap)),
        metrics,
      ),
    )
  }

  return new TieredCache(_caches)
}
