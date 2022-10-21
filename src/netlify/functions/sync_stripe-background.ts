import { BackgroundHandler } from '@netlify/functions'
import { syncAllAccountData } from '../../stripe/sync'

export const handler: BackgroundHandler = async (event, context) => {
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
}
