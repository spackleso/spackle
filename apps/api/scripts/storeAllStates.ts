import db, { stripeAccounts } from 'spackle-db'
import { storeAccountStates } from '../src/store/dynamodb'

async function main() {
  const result = await db
    .select({
      stripeId: stripeAccounts.stripeId,
    })
    .from(stripeAccounts)

  for (const { stripeId } of result) {
    console.log(`Storing ${stripeId}...`)
    await storeAccountStates(stripeId)
  }

  process.exit(0)
}

main()
