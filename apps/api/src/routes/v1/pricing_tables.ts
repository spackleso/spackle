import { authorizeToken, verifyToken } from '@/lib/auth/token'
import { APIHonoEnv, App } from '@/lib/hono/env'
import { initServices } from '@/lib/services/init'
import { OpenAPIHono } from '@hono/zod-openapi'
import { Context } from 'hono'

const app = new OpenAPIHono() as App

app.get('/:id/state', async (c: Context<APIHonoEnv>) => {
  const authorization = c.req.header('authorization') || 'Bearer '
  const tokenStr = authorization.split(' ')[1]
  const pricingTableId = c.req.param('id')

  const fetchState = async () => {
    const services = initServices(c.get('sentry'), c.get('cache'), c.env)

    let token
    try {
      token = await authorizeToken(
        tokenStr,
        c.env.SUPABASE_JWT_SECRET,
        services.db,
      )
    } catch (error) {
      return null
    }

    try {
      return await services.pricingTablesService.getPricingTableState(
        token.sub,
        pricingTableId,
      )
    } catch (error) {
      return null
    }
  }

  let payload
  try {
    payload = await verifyToken(tokenStr, c.env.SUPABASE_JWT_SECRET)
  } catch (error) {
    c.status(401)
    return c.json({ error: 'Unauthorized' })
  }

  const stripeAccountId = payload.sub
  const cacheKey = `${stripeAccountId}:${pricingTableId}`
  const cache = c.get('cache')

  let [state, stale] = await cache.get('pricingTableState', cacheKey)
  if (state) {
    if (stale) {
      c.executionCtx.waitUntil(
        fetchState().then((s) => {
          if (s) {
            cache.set('pricingTableState', cacheKey, s)
          } else {
            cache.remove('pricingTableState', cacheKey)
          }
        }),
      )
    }
    return c.json(state)
  }

  state = await fetchState()
  if (!state) {
    c.status(404)
    return c.json({ error: 'Not found' })
  }
  await c.get('cache').set('pricingTableState', cacheKey, state)
  return c.json(state)
})

app.get('/:id', async (c: Context<APIHonoEnv>) => {
  const id = c.req.param('id')
  try {
    const data = await c
      .get('pricingTablesService')
      .getPricingTableState(c.get('token').sub, id)
    return c.json(data)
  } catch (error: any) {
    if (error.message === 'Not Found') {
      c.status(404)
      return c.json({ error: 'Not Found' })
    }
    c.status(500)
    return c.json({ error: 'Internal Server Error' })
  }
})

app.all('/*', async (c: Context<APIHonoEnv>) => {
  c.status(405)
  return c.json({ error: 'Method Not Allowed' })
})

export default app
