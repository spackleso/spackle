import { BackgroundHandler } from '@netlify/functions'
import { customerKey } from '../../src/store/upstash'
import * as Sentry from '@sentry/serverless'
import { logger } from '../../src/logger'
import { supabase, SupabaseError } from '../../src/supabase'
import {
  getCustomerState,
  getCustomerSubscriptionsState,
} from '../../src/state'
import fetch from 'node-fetch'

const { SENTRY_DSN, BACKGROUND_API_TOKEN } = process.env
const url = process.env.UPSTASH_REDIS_REST_URL || ''
const token = process.env.UPSTASH_REDIS_REST_TOKEN || ''

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
      const { data, error } = await supabase
        .from('stripe_customers')
        .select('stripe_id')
        .eq('stripe_account_id', stripe_account_id)

      if (error) {
        throw new SupabaseError(error)
      }

      const ops: any[] = []
      for (let { stripe_id } of data) {
        const subscriptions = await getCustomerSubscriptionsState(
          stripe_account_id,
          stripe_id,
        )
        const features = await getCustomerState(stripe_account_id, stripe_id)
        ops.push([
          'SET',
          customerKey(stripe_account_id, stripe_id),
          JSON.stringify({ features, subscriptions }),
        ])
      }
      await fetch(`${url}/pipeline`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(ops),
      })
    } else {
      logger.warn(`Invalid account: ${stripe_account_id}`, event.body)
    }
  },
) as BackgroundHandler
