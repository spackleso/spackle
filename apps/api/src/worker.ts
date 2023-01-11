import supabase, { SupabaseError } from 'spackle-supabase'
import { logger } from '@/logger'
import { syncAllAccountData } from '@/stripe/sync'
import * as Sentry from '@sentry/node'

const SENTRY_DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN

Sentry.init({
  dsn: SENTRY_DSN || '',
  tracesSampleRate: 0,
  enabled: process.env.NODE_ENV === 'production',
})

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function getAccountIdToBeSynced(): Promise<string | null> {
  const filter = new Date(Date.now() - 1000 * 30 * 60).toISOString()
  const { data, error } = await supabase
    .from('stripe_accounts')
    .select('*')
    .eq('initial_sync_complete', false)
    .eq('has_acknowledged_setup', true)
    .or(`initial_sync_started_at.is.null,initial_sync_started_at.lt.${filter}`)
    .limit(1)
    .maybeSingle()

  if (error) {
    throw new SupabaseError(error)
  }

  if (data) {
    return data.stripe_id
  }

  return null
}

export async function start() {
  logger.info('Starting worker...')
  while (true) {
    try {
      throw new Error('test')
      // const stripeAccountId = await getAccountIdToBeSynced()
      // if (stripeAccountId) {
      //   logger.info(`Syncing account: ${stripeAccountId}`)
      //   await syncAllAccountData(stripeAccountId)
      // }
    } catch (error) {
      logger.error('Error in worker', error)
      Sentry.captureException(error)
      process.exit(1)
    }
    await sleep(5000)
  }
}
