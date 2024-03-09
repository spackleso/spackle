import { TieredCache } from '@/lib/cache/tiered'
import { Context, Hono } from 'hono'
import { StatusCode } from 'hono/utils/http-status'

const app = new Hono()

app.get('/:id/state', async (c: Context) => {
  const id = c.req.param('id')
  const cache = c.get('cache') as TieredCache
  const url = `${c.get('origin')}/v1/customers/${id}/state`
  const headers = { Authorization: c.req.header('Authorization') ?? '' }

  let [state, stale] = await cache.get('customerState', id)
  if (state) {
    console.log('Cache hit for', id)
    if (stale) {
      console.log('Revalidating stale cache for', id)
      c.executionCtx.waitUntil(
        fetch(url, { headers }).then(async (res) => {
          if (!res.ok) {
            return
          }

          const newState = await res.json()
          return cache.set('customerState', id, newState)
        }),
      )
    }
    return c.json(state)
  }

  console.log('Cache miss for', id)
  const res = await fetch(url, { headers })
  if (!res.ok) {
    c.status(res.status as StatusCode)
    return c.json(await res.json())
  }
  state = await res.json()
  await c.get('cache').set('customerState', id, state)
  return c.json(state)
})

export default app
