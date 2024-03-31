import { Context } from 'hono'
import customerFeatures from './customer_features'
import customers from './customers'
import features from './features'
import pricingTables from './pricing_tables'
import productFeatures from './product_features'
import { OpenAPIHono, createRoute } from '@hono/zod-openapi'
import { APIHonoEnv, App } from '@/lib/hono/env'
import { authorizeToken } from '@/lib/auth/token'
import { otel } from '@/lib/hono/otel'

const app = new OpenAPIHono() as App

function tokenAuth(exemptPaths: string[] = []) {
  return async (c: Context<APIHonoEnv>, next: any) => {
    const matchedPaths = c.req.matchedRoutes
      .map((r) => r.path)
      .filter((p) => !p.includes('*'))

    if (!matchedPaths.filter((p) => exemptPaths.includes(p)).length) {
      const authorization = c.req.header('authorization') || 'Bearer '
      const tokenStr = authorization.split(' ')[1]

      let payload
      try {
        payload = await authorizeToken(
          tokenStr,
          c.env.SUPABASE_JWT_SECRET,
          c.get('db'),
        )
      } catch (error) {
        c.status(401)
        return c.json({ error: 'Unauthorized' })
      }

      c.set('token', payload)
    }
    await next()
  }
}

app.use(
  '*',
  tokenAuth([
    '/',
    '/openapi.json',
    '/customers/:id/state',
    '/v1/customers/:id/state',
    '/pricing_tables/:id/state',
    '/v1/pricing_tables/:id/state',
  ]),
)

app.route('/customers', customers)
app.route('/customer_features', customerFeatures)
app.route('/features', features)
app.route('/product_features', productFeatures)
app.route('/pricing_tables', pricingTables)

const route = createRoute({
  method: 'get',
  path: '/',
  responses: {
    200: {
      description: 'index',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              message: { type: 'string' },
            },
          },
        },
      },
    },
  },
})

app.openapi(route, (c: Context) => {
  return c.json({ message: 'Spackle API V1' })
})

export default app
