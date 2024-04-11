import type { Metrics } from '@/lib/metrics'
import type { Cache } from '@/lib/cache/interface'

export class CacheWithMetrics implements Cache {
  private cache: Cache
  private readonly metrics: Metrics | undefined = undefined

  private constructor(opts: { cache: Cache; metrics?: Metrics }) {
    this.cache = opts.cache
    this.metrics = opts.metrics
  }
  static wrap(cache: Cache, metrics: Metrics): Cache {
    return new CacheWithMetrics({ cache, metrics })
  }

  public get tier() {
    return this.cache.tier
  }

  public async get(
    namespace: string,
    key: string,
  ): Promise<[unknown | undefined, boolean]> {
    const start = performance.now()
    const res = await this.cache.get(namespace, key)
    const [cached, stale] = res

    if (this.metrics) {
      this.metrics.emit({
        metric: 'metric.cache.get',
        hit: typeof cached !== 'undefined',
        stale: stale,
        latency: performance.now() - start,
        tier: this.tier,
        namespace: String(namespace),
        key,
      })
    }
    return res
  }

  public async set(
    namespace: string,
    key: string,
    value: unknown,
  ): Promise<void> {
    if (this.metrics) {
      this.metrics.emit({
        metric: 'metric.cache.set',
        tier: this.tier,
        namespace: String(namespace),
        key,
      })
    }
    return this.cache.set(namespace, key, value)
  }

  public async remove(namespace: string, key: string): Promise<void> {
    if (this.metrics) {
      this.metrics.emit({
        metric: 'metric.cache.remove',
        tier: this.tier,
        namespace: String(namespace),
        key,
      })
    }
    return this.cache.remove(namespace, key)
  }
}
