import { type Tracer, trace } from '@opentelemetry/api'
import type { Cache } from './interface'

export class CacheWithTracing implements Cache {
  private readonly cache: Cache
  private readonly tracer: Tracer

  private constructor(cache: Cache) {
    this.tracer = trace.getTracer('cache')
    this.cache = cache
  }

  static wrap(cache: Cache): Cache {
    return new CacheWithTracing(cache)
  }

  public get tier() {
    return this.cache.tier
  }

  public async get(
    namespace: string,
    key: string,
  ): Promise<[unknown | undefined, boolean]> {
    const span = this.tracer.startSpan(`cache.${this.cache.tier}.get`)
    span.setAttribute('cache.namespace', namespace as string)
    span.setAttribute('cache.key', key)
    const res = await this.cache.get(namespace, key)
    span.setAttribute('cache.hit', !!res[0])
    span.setAttribute('cache.stale', res[1])
    span.end()
    return res
  }

  public async set(
    namespace: string,
    key: string,
    value: unknown,
  ): Promise<void> {
    const span = this.tracer.startSpan(`cache.${this.cache.tier}.set`)
    try {
      span.setAttribute('cache.namespace', namespace as string)
      span.setAttribute('cache.key', key)
      return await this.cache.set(namespace, key, value)
    } finally {
      span.end()
    }
  }

  public async remove(namespace: string, key: string): Promise<void> {
    const span = this.tracer.startSpan(`cache.${this.cache.tier}.remove`)

    try {
      span.setAttribute('cache.namespace', namespace as string)
      span.setAttribute('cache.key', key)
      return await this.cache.remove(namespace, key)
    } finally {
      span.end()
    }
  }
}
