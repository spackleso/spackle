import { APIHonoEnv, App } from '@/lib/hono/env'
import { OpenAPIHono } from '@hono/zod-openapi'
import { and, eq, schema } from '@spackle/db'
import { Context } from 'hono'
import { authorizeToken, verifyToken } from '@/lib/auth/token'
import { initServices } from '@/lib/services/init'

const app = new OpenAPIHono() as App

app.get('/:id', async (c: Context<APIHonoEnv>) => {
  if (c.get('token').publishable) {
    c.status(403)
    return c.json({ error: 'Forbidden' })
  }

  const stripeCustomerId = c.req.param('id')
  const stripeAccountId = c.get('token').sub
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
      c.status(404)
      return c.json({ error: 'Not found' })
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

  const state = await c
    .get('entitlementsService')
    .getCustomerState(stripeAccountId, stripeCustomerId)

  return c.json(state)
})

app.get('/:id/state', async (c: Context<APIHonoEnv>) => {
  const authorization = c.req.header('authorization') || 'Bearer '
  const tokenStr = authorization.split(' ')[1]
  const stripeCustomerId = c.req.param('id')

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

    if (token.publishable) {
      return null
    }

    const stripeAccountId = token.sub
    const customers = await services.db
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
        await services.stripeService.syncStripeSubscriptions(
          stripeAccountId,
          customer.stripeId,
          'live',
        )
      } catch (error) {
        await services.stripeService.syncStripeSubscriptions(
          stripeAccountId,
          customer.stripeId,
          'test',
        )
      }
    }

    return await services.entitlementsService.getCustomerState(
      stripeAccountId,
      stripeCustomerId,
    )
  }

  let payload
  try {
    payload = await verifyToken(tokenStr, c.env.SUPABASE_JWT_SECRET)
  } catch (error) {
    c.status(401)
    return c.json({ error: 'Unauthorized' })
  }

  if (!payload.sub) {
    c.status(401)
    return c.json({ error: 'Unauthorized' })
  }

  if (payload.publishable) {
    c.status(403)
    return c.json({ error: 'Forbidden' })
  }

  const stripeAccountId = payload.sub
  const cacheKey = `${stripeAccountId}:${stripeCustomerId}`
  const cache = c.get('cache')

  let [state, stale] = await cache.get('customerState', cacheKey)
  if (state) {
    if (stale) {
      c.executionCtx.waitUntil(
        fetchState().then((s) => {
          if (s) {
            cache.set('customerState', cacheKey, s)
          } else {
            cache.remove('customerState', cacheKey)
          }
        }),
      )
    }
    c.env.ENTITLEMENT_CHECKS.writeDataPoint({
      indexes: [stripeAccountId],
      blobs: [stripeCustomerId],
    })
    return c.json(state)
  }

  state = await fetchState()
  if (!state) {
    c.status(404)
    return c.json({ error: 'Not found' })
  }
  await c.get('cache').set('customerState', cacheKey, state)

  c.env.ENTITLEMENT_CHECKS.writeDataPoint({
    indexes: [stripeAccountId],
    blobs: [stripeCustomerId],
  })
  return c.json(state)
})

app.all('/*', async (c: Context<APIHonoEnv>) => {
  c.status(405)
  return c.json({ error: 'Method Not Allowed' })
})

export default app
