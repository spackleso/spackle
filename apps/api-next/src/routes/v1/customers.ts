import { TieredCache } from '@/lib/cache/tiered'
import { APIHonoEnv, App } from '@/lib/hono/env'
import { OpenAPIHono } from '@hono/zod-openapi'
import { and, eq, schema } from '@spackle/db'
import { Context } from 'hono'

const app = new OpenAPIHono() as App

app.use('*', async (c: Context<APIHonoEnv>, next) => {
  if (c.get('token').publishable) {
    c.status(403)
    return c.json({ error: 'Forbidden' })
  }
  return next()
})

app.get('/:id/state', async (c: Context<APIHonoEnv>) => {
  const stripeAccountId = c.get('token').sub
  const stripeCustomerId = c.req.param('id')
  const cacheKey = `${stripeAccountId}:${stripeCustomerId}`
  const cache = c.get('cache')

  const fetchState = async () => {
    const customers = await c
      .get('db')
      .select()
      .from(schema.stripeCustomers)
      .where(
        and(
          eq(schema.stripeCustomers.stripeId, stripeCustomerId),
          eq(schema.stripeCustomers.stripeAccountId, stripeAccountId),
        ),
      )

    let customer
    if (customers.length) {
      customer = customers[0]
    } else {
      try {
        customer = await c
          .get('stripeService')
          .syncStripeCustomer(stripeAccountId, stripeCustomerId, 'live')
      } catch (error) {
        try {
          customer = await c
            .get('stripeService')
            .syncStripeCustomer(stripeAccountId, stripeCustomerId, 'test')
        } catch (error) {}
      }
      if (!customer) {
        return null
      }
      try {
        await c
          .get('stripeService')
          .syncStripeSubscriptions(stripeAccountId, customer.stripeId, 'live')
      } catch (error) {
        await c
          .get('stripeService')
          .syncStripeSubscriptions(stripeAccountId, customer.stripeId, 'test')
      }
    }

    return await c
      .get('entitlementsService')
      .getCustomerState(stripeAccountId, stripeCustomerId)
  }

  let [state, stale] = await cache.get('customerState', cacheKey)
  if (state) {
    console.log('Cache hit for', cacheKey)
    if (stale) {
      console.log('Revalidating stale cache for', cacheKey)
      c.executionCtx.waitUntil(
        fetchState().then((s) => cache.set('customerState', cacheKey, s)),
      )
    }
    return c.json(state)
  }

  console.log('Cache miss for', cacheKey)
  state = await fetchState()
  if (!state) {
    c.status(404)
    return c.json({ error: 'Not found' })
  }
  await c.get('cache').set('customerState', cacheKey, state)
  return c.json(state)
})

app.all('/*', async (c: Context<APIHonoEnv>) => {
  c.status(405)
  return c.json({ error: 'Method Not Allowed' })
})

export default app
