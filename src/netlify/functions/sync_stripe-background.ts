import { BackgroundHandler } from '@netlify/functions'
import { syncAllAccountData } from '../../stripe/sync'

export const handler: BackgroundHandler = async (event, context) => {
  if (event.httpMethod !== 'POST' || !event.body) {
    console.log('Invalid request', event)
    return
  }

  const { account_id } = JSON.parse(event.body)
  if (account_id) {
    await syncAllAccountData(account_id)
  } else {
    console.log(`Invalid account: ${account_id}`, event.body)
  }
}
