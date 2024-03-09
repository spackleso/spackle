import { Context, Hono } from 'hono'
import { MemoryCache } from '@/lib/cache/memory'
import { PersistentCache } from '@/lib/cache/persistent'
import { TieredCache } from '@/lib/cache/tiered'
import v1 from './routes/v1'

const cacheMap = new Map()

function init() {
  const cache = new TieredCache([
    new MemoryCache(cacheMap),
    new PersistentCache(),
  ])
  return async (c: Context, next: () => Promise<void>) => {
    c.set('cache', cache)
    await next()
  }
}

const app = new Hono()
app.use('*', init())

app.route('/v1', v1)
app.route('/', v1)
app.get('/', (c: Context) => {
  return c.text('')
})

export default app
