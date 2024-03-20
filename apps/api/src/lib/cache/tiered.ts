import { Cache } from './interface'

export class TieredCache implements Cache {
  private readonly caches: Cache[]

  constructor(caches: Cache[]) {
    this.caches = caches
  }

  async get(
    namespace: string,
    key: string,
  ): Promise<[unknown | undefined, boolean]> {
    for (let i = 0; i < this.caches.length; i++) {
      const res = await this.caches[i].get(namespace, key)
      if (typeof res[0] !== 'undefined') {
        for (let j = 0; j < i; j++) {
          await this.caches[j].set(namespace, key, res[0])
        }
        return res
      }
    }
    return [undefined, false]
  }

  async set(namespace: string, key: string, value: any) {
    await Promise.all(
      this.caches.map((cache) => cache.set(namespace, key, value)),
    )
  }

  async remove(namespace: string, key: string) {
    await Promise.all(this.caches.map((cache) => cache.remove(namespace, key)))
  }
}
