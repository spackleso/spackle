import { BackgroundHandler } from '@netlify/functions'
import { syncAllAccountData } from '../../stripe/sync'
import * as Sentry from '@sentry/serverless'

const { SENTRY_DSN } = process.env

Sentry.AWSLambda.init({
  dsn: SENTRY_DSN,
  tracesSampleRate: 1.0,
})

export const handler = Sentry.AWSLambda.wrapHandler(async (event, context) => {
  if (!event.queryStringParameters || !event.queryStringParameters.account_id) {
    console.log('Invalid request', event)
    return
  }

  const { account_id } = event.queryStringParameters
  if (account_id) {
    await syncAllAccountData(account_id)
  } else {
    console.log(`Invalid account: ${account_id}`, event.body)
  }
})
