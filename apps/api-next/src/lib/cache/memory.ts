import { CACHE_MAX_AGE, CACHE_STALE_WHILE_REVALIDATE } from './cache-control'
import { Cache, Entry } from './interface'

export class MemoryCache implements Cache {
  private readonly state: Map<`${string}:${string}`, Entry<unknown>>

  constructor(persistedMap: Map<`${string}:${string}`, Entry<unknown>>) {
    this.state = persistedMap
  }

  async get(
    namespace: string,
    key: string,
  ): Promise<[unknown | undefined, boolean]> {
    const entry = this.state.get(`${namespace}:${key}`)
    const now = Date.now()
    if (!entry) {
      return [undefined, false]
    } else if (now > entry.maxStale) {
      this.remove(namespace, key)
      return [undefined, false]
    } else if (now > entry.maxFresh) {
      return [entry.value, true]
    } else {
      return [entry.value, false]
    }
  }

  async set(namespace: string, key: string, value: any) {
    this.state.set(`${namespace}:${key}`, {
      value,
      maxFresh: Date.now() + CACHE_STALE_WHILE_REVALIDATE,
      maxStale: Date.now() + CACHE_MAX_AGE,
    })
  }

  async remove(namespace: string, key: string) {
    this.state.delete(`${namespace}:${key}`)
  }
}
