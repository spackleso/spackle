import { CACHE_MAX_AGE, CACHE_STALE_WHILE_REVALIDATE } from './cache-control'
import { Cache, Entry } from './interface'

export type ZoneCacheConfig = {
  domain: string
  zoneId: string
  cloudflareApiKey: string
}

export class ZoneCache implements Cache {
  public readonly tier = 'zone'

  config: ZoneCacheConfig

  constructor(config: ZoneCacheConfig) {
    this.config = config
  }

  private createCacheKey(
    namespace: string,
    key: string,
    cacheBuster = 'v1',
  ): URL {
    return new URL(
      `https://${this.config.domain}/${cacheBuster}/${String(
        namespace,
      )}/${key}`,
    )
  }

  async get(
    namespace: string,
    key: string,
  ): Promise<[unknown | undefined, boolean]> {
    const res = await caches.default.match(
      new Request(this.createCacheKey(namespace, key)),
    )
    if (!res) {
      return [undefined, false]
    }

    const now = Date.now()
    const entry = (await res.json()) as Entry<unknown>
    if (now > entry.maxStale) {
      await this.remove(namespace, key)
      return [undefined, false]
    } else if (now > entry.maxFresh) {
      return [entry.value, true]
    } else {
      return [entry.value, false]
    }
  }

  async set(namespace: string, key: string, value: unknown) {
    const entry: Entry<unknown> = {
      value,
      maxFresh: Date.now() + CACHE_STALE_WHILE_REVALIDATE,
      maxStale: Date.now() + CACHE_MAX_AGE,
    }
    const request = new Request(this.createCacheKey(namespace, key))
    const response = new Response(JSON.stringify(entry), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': `public, max-age=${Math.floor(entry.maxStale / 1000)}`,
      },
    })
    await caches.default.put(request, response)
  }

  async remove(namespace: string, key: string) {
    await Promise.all([
      caches.default.delete(new Request(this.createCacheKey(namespace, key))),
      fetch(
        `https://api.cloudflare.com/client/v4zones/${this.config.zoneId}/purge_cache`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.config.cloudflareApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            files: [this.createCacheKey(namespace, key).toString()],
          }),
        },
      ),
    ])
    return
  }
}
