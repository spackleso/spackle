import { Context } from 'hono'
import customers from './customers'
import { OpenAPIHono, createRoute } from '@hono/zod-openapi'

const app = new OpenAPIHono()

app.route('/customers', customers)

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
