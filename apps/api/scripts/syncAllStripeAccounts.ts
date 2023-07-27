import db, { stripeAccounts } from 'spackle-db'
import { syncAllAccountData } from '../src/stripe/sync'

async function main() {
  const result = await db
    .select({ stripeId: stripeAccounts.stripeId })
    .from(stripeAccounts)
  for (const { stripeId } of result) {
    console.log(`Syncing ${stripeId}...`)
    await syncAllAccountData(stripeId)
  }
  process.exit(0)
}

main()
