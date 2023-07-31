import { storeAccountStates } from '@/store/dynamodb'
import db, { stripeAccounts } from 'spackle-db'
import { syncAllAccountData } from '../src/stripe/sync'

async function main() {
  const result = await db
    .select({
      stripeId: stripeAccounts.stripeId,
    })
    .from(stripeAccounts)

  for (const { stripeId } of result) {
    let retries = 0
    while (retries < 3) {
      try {
        console.log(`Syncing ${stripeId}...`)
        await syncAllAccountData(stripeId)
        console.log(`Storing ${stripeId}...`)
        await storeAccountStates(stripeId)
        break
      } catch (e) {
        console.error(e)
        retries++
        continue
      }
    }
  }
  process.exit(0)
}

main()
