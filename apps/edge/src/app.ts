import * as Sentry from '@sentry/node'
import * as dotenv from 'dotenv'
import express from 'express'
import { requestToken } from './auth'
import { getCustomerState } from './dynamodb'
import { Logtail } from '@logtail/node'

try {
  dotenv.config({ path: __dirname + '/.env' })
} catch (error) {}

const app = express()

Sentry.init({
  enabled: process.env.NODE_ENV === 'production',
  dsn: 'https://1df7ea7ed7c346b6a6609088e1ffe2c2@o271958.ingest.sentry.io/4505575227129856',
  integrations: [
    // enable HTTP calls tracing
    new Sentry.Integrations.Http({
      tracing: true,
    }),
    // enable Express.js middleware tracing
    new Sentry.Integrations.Express({
      app,
    }),
  ],
  // Performance monitoring disabled for now
  enableTracing: false,
  tracesSampleRate: 0,
})

const region = process.env.AWS_REGION ?? ''
const logtail = new Logtail(process.env.BETTERSTACK_LOGS_TOKEN ?? '')

app.use(Sentry.Handlers.requestHandler())
app.use(Sentry.Handlers.tracingHandler())

app.get('/', (req, res) => {
  res.send('')
})

app.get('/customers/:id/state', async (req, res) => {
  const start = Date.now()

  let accountId: string = ''
  try {
    const { sub } = requestToken(req.headers)
    accountId = sub
  } catch (error) {
    accountId = ''
  }

  if (!accountId) {
    res.status(401).send('')
    return
  }

  const schemaVersion = req.headers['x-spackle-schema-version'] ?? '1'
  let state = await getCustomerState(
    accountId,
    req.params.id,
    Number(schemaVersion),
  )

  if (state) {
    res.end(state)

    const duration = Date.now() - start
    try {
      logtail.info(
        `[${region}] GET /customers/${req.params.id}/state: ${duration}ms`,
        {
          accountId,
          customerId: req.params.id,
          duration,
          region,
        },
      )
    } catch (error) {
      console.error(error)
    }
  } else {
    res.status(404).send('')
  }
})

app.use(Sentry.Handlers.errorHandler())

app.use(function onError(err: any, req: any, res: any, next: any) {
  res.statusCode = 500
  res.end(res.sentry + '\n')
})

export default app
