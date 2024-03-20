import { cors } from 'hono/cors'
import { sentry } from '@hono/sentry'
import stripe from '@/routes/stripe'
import v1 from '@/routes/v1'
import { OpenAPIHono } from '@hono/zod-openapi'
import { App, HonoEnv, Job } from '@/lib/hono/env'
import { Toucan } from 'toucan-js'
import { initServices } from '@/lib/services/init'
import { initCacheContext, initServiceContext } from '@/lib/hono/context'
import { SYNC_OPS, StripeService } from '@/lib/services/stripe'
import signup from '@/routes/signup'

const cacheMap = new Map()
const app = new OpenAPIHono<HonoEnv>() as App

app.use('*', cors())
app.use('*', (c, next) => {
  return sentry({
    enabled: !!c.env.SENTRY_DSN,
  })(c, next)
})

app.use('*', initCacheContext(cacheMap))
app.use(
  '*',
  initServiceContext(['/customers/:id/state', '/v1/customers/:id/state']),
)

app.post('/signup', signup)
app.route('/stripe', stripe)
app.route('/v1', v1)
app.route('/', v1)
app.doc('/openapi.json', {
  openapi: '3.0.0',
  info: {
    version: '1.0.0',
    title: 'Spackle API',
  },
})

app.queue = async (batch: MessageBatch<Job>, env: HonoEnv['Bindings']) => {
  const sentry = new Toucan({
    dsn: env.SENTRY_DSN,
    enabled: !!env.SENTRY_DSN,
  })
  const services = initServices(sentry, env)
  for (const message of batch.messages) {
    const { type, payload } = message.body
    if (SYNC_OPS.includes(type)) {
      const op = type as keyof StripeService
      await (services.stripeService[op] as any)(
        payload.stripeAccountId,
        payload.mode,
        payload.syncJobId,
      )
    }
  }
}

export default app
