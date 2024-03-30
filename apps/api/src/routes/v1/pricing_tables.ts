import { APIHonoEnv, App } from '@/lib/hono/env'
import { OpenAPIHono } from '@hono/zod-openapi'
import { Context } from 'hono'

const app = new OpenAPIHono() as App

app.get('/:id', async (c: Context<APIHonoEnv>) => {
  const id = c.req.param('id')
  try {
    const data = await c
      .get('pricingTablesService')
      .getPricingTableState(c.get('token').sub, id)
    return c.json(data)
  } catch (error: any) {
    console.log(error)
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
