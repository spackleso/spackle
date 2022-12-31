import { BackgroundHandler } from '@netlify/functions'
import { syncAllAccountData } from '../../src/stripe/sync'
import * as Sentry from '@sentry/serverless'
import { logger } from '../../src/logger'

const { SENTRY_DSN, BACKGROUND_API_TOKEN } = process.env

Sentry.AWSLambda.init({
  dsn: SENTRY_DSN,
  tracesSampleRate: 1.0,
})

// TODO: secure via Stripe signature
export const handler: BackgroundHandler = Sentry.AWSLambda.wrapHandler(
  async (event, context) => {
    const authorization = event.headers.authorization
    if (
      !event.queryStringParameters ||
      !event.queryStringParameters.stripe_account_id ||
      authorization !== `Token ${BACKGROUND_API_TOKEN}`
    ) {
      logger.warn('Invalid request', event, authorization)
      return
    }

    const { stripe_account_id } = event.queryStringParameters
    if (stripe_account_id) {
      await syncAllAccountData(stripe_account_id)
    } else {
      logger.warn(`Invalid account: ${stripe_account_id}`, event.body)
    }
  },
) as BackgroundHandler
