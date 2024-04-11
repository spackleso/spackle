import { cors } from 'hono/cors'
import { sentry } from '@hono/sentry'
import stripe from '@/routes/stripe'
import v1 from '@/routes/v1'
import { OpenAPIHono } from '@hono/zod-openapi'
import { App, HonoEnv, Job } from '@/lib/hono/env'
import { Toucan } from 'toucan-js'
import { initServices } from '@/lib/services/init'
import { initMiddlewareContext, initServiceContext } from '@/lib/hono/context'
import signup from '@/routes/signup'
import { Env } from 'hono'
import { otel } from '@/lib/hono/otel'
import { instrument, ResolveConfigFn } from '@microlabs/otel-cf-workers'
import { Context as OTContext, Span } from '@opentelemetry/api'
import { initMetrics } from './lib/metrics/init'
import { initCache } from './lib/cache/init'

const app = new OpenAPIHono<HonoEnv>() as App

app.use('*', cors())
app.use('*', (c, next) => {
  return sentry({
    enabled: !!c.env.SENTRY_DSN,
  })(c, next)
})
app.use('*', otel())
app.use('*', initMiddlewareContext())
app.use(
  '*',
  initServiceContext([
    '/openapi.json',
    '/customers/:id/state',
    '/v1/customers/:id/state',
    '/pricing_tables/:id/state',
    '/v1/pricing_tables/:id/state',
  ]),
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
  const metrics = initMetrics(env)
  const cache = initCache(env, metrics)
  const services = initServices(sentry, cache, env)
  for (const message of batch.messages) {
    const { type, payload } = message.body
    switch (type) {
      case 'sync': {
        await services.syncService.sync(payload.syncJobId)
      }
      default: {
        sentry.captureMessage(`Unknown message type: ${type}`)
      }
    }
  }
}

const handler = {
  fetch(req: Request, env: HonoEnv, ctx: ExecutionContext) {
    return app.fetch(req, env, ctx)
  },
  queue(batch: MessageBatch<Job>, env: Env) {
    return app.queue(batch, env as HonoEnv['Bindings'])
  },
  request(
    req: Request,
    opts: RequestInit,
    env: HonoEnv['Bindings'],
    ctx: ExecutionContext,
  ) {
    return app.request(req, opts, env, ctx)
  },
}

const config: ResolveConfigFn = (env: HonoEnv['Bindings'], _trigger) => {
  if (!env.AXIOM_API_TOKEN || !env.AXIOM_DATASET) {
    return {
      spanProcessors: {
        forceFlush: () => Promise.resolve(),
        onStart: (_span: Span, _parentContext: OTContext) => {},
        onEnd: (_span) => console.log(_span.name),
        shutdown: () => Promise.resolve(),
      },
      service: {
        name: `api.${env.ENVIRONMENT}`,
        version: env.VERSION,
      },
    }
  }

  return {
    exporter: {
      url: 'https://api.axiom.co/v1/traces',
      headers: {
        Authorization: `Bearer ${env.AXIOM_API_TOKEN}`,
        'X-Axiom-Dataset': `${env.AXIOM_DATASET}`,
      },
    },
    service: {
      name: `api.${env.ENVIRONMENT}`,
      version: env.VERSION,
    },
  }
}

export default instrument(handler, config) as OpenAPIHono<HonoEnv>
