import { cors } from 'hono/cors'
import { sentry } from '@hono/sentry'
import stripe from '@/routes/stripe'
import v1 from '@/routes/v1'
import { OpenAPIHono } from '@hono/zod-openapi'
import { App, HonoEnv, Job } from '@/lib/hono/env'
import { Toucan } from 'toucan-js'
import { initServices } from '@/lib/services/init'
import { initCacheContext, initServiceContext } from '@/lib/hono/context'
import signup from '@/routes/signup'
import { Env } from 'hono'
import type { Context, Span } from '@opentelemetry/api'
import {
  ConsoleSpanExporter,
  ReadableSpan,
} from '@opentelemetry/sdk-trace-base'
import { otel } from '@/lib/hono/otel'
import { instrument, ResolveConfigFn } from '@microlabs/otel-cf-workers'

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
app.use('*', otel())

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
  fetch(req: Request, env: HonoEnv, executionContext: ExecutionContext) {
    return app.fetch(req, env, executionContext)
  },
  queue(batch: MessageBatch<Job>, env: Env) {
    return app.queue(batch, env as HonoEnv['Bindings'])
  },
  request(req: Request, opts: RequestInit, executionContext: ExecutionContext) {
    return app.request(req, opts, executionContext)
  },
}

const config: ResolveConfigFn = (env: HonoEnv['Bindings'], _trigger) => {
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
    postProcessor: (spans: ReadableSpan[]): ReadableSpan[] => {
      console.log(spans.map((s) => s.name))
      return spans
    },
  }
}

export default instrument(handler, config) as OpenAPIHono<HonoEnv>
