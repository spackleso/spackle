import { Context, Hono } from 'hono'
import { MemoryCache } from '@/lib/cache/memory'
import { PersistentCache } from '@/lib/cache/persistent'
import { TieredCache } from '@/lib/cache/tiered'
import { StatusCode } from 'hono/utils/http-status'
import { cors } from 'hono/cors'
import { sentry } from '@hono/sentry'
import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import stripe from '@/routes/stripe'
import v1 from '@/routes/v1'
import { schema } from '@spackle/db'

const cacheMap = new Map()

function init() {
  const cache = new TieredCache([
    new MemoryCache(cacheMap),
    new PersistentCache(),
  ])
  return async (c: Context, next: () => Promise<void>) => {
    c.set('cache', cache)
    c.set('origin', c.env.ORIGIN)
    const client = postgres(c.env.DATABASE_URL)
    c.set('db', drizzle(client, { schema }))
    await next()
    await client.end()
  }
}

const app = new Hono()
app.use('*', cors())
app.use('*', sentry())
app.use('*', init())

app.route('/stripe', stripe)
app.route('/v1', v1)
app.route('/', v1)
app.all('/*', async (c: Context) => {
  // Proxy all other requests to the origin
  const url = `${c.get('origin')}${c.req.path}`
  console.log('Proxying request to', url)
  const res = await fetch(`${c.get('origin')}${c.req.path}`, {
    headers: c.req.raw.headers,
    body: c.req.raw.body,
    method: c.req.method,
  })
  c.status(res.status as StatusCode)
  if (res.headers.get('Content-Type') === 'application/json') {
    return c.json(await res.json())
  } else if (res.headers.get('Content-Type') === 'text/html') {
    return c.html(await res.text())
  } else {
    return c.text(await res.text())
  }
})

export default app
