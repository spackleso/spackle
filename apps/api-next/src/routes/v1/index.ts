import { Context } from 'hono'
import customerFeatures from './customer_features'
import customers from './customers'
import features from './features'
import pricingTables from './pricing_tables'
import productFeatures from './product_features'
import { OpenAPIHono, createRoute } from '@hono/zod-openapi'
import { APIHonoEnv } from '@/lib/hono/env'
import jwt from '@tsndr/cloudflare-worker-jwt'
import { eq, schema } from '@spackle/db'

const app = new OpenAPIHono()

type TokenPayload = {
  sub: string
  iat: number
  publishable?: boolean
}

app.use('*', async (c: Context<APIHonoEnv>, next) => {
  const authorization = c.req.header('authorization') || 'Bearer '
  const tokenStr = authorization.split(' ')[1]

  let payload
  try {
    const data = jwt.decode(tokenStr)
    payload = data.payload
  } catch (error) {}

  if (!payload || !(await jwt.verify(tokenStr, c.env.SUPABASE_JWT_SECRET))) {
    c.status(401)
    return c.json({ error: 'Unauthorized' })
  }

  const sub = payload.sub as string
  const publishable = !!(payload as TokenPayload).publishable

  if (publishable) {
    const response = await c
      .get('db')
      .select()
      .from(schema.publishableTokens)
      .where(eq(schema.publishableTokens.token, tokenStr))

    if (!response.length) {
      c.status(401)
      return c.json({ error: 'Unauthorized' })
    }
  } else {
    const response = await c
      .get('db')
      .select()
      .from(schema.tokens)
      .where(eq(schema.tokens.token, tokenStr))

    if (!response.length) {
      c.status(401)
      return c.json({ error: 'Unauthorized' })
    }
  }

  c.set('token', {
    sub,
    publishable,
  })

  return next()
})

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
