import { storeCustomerState } from '../src/store/dynamodb'
import { program } from 'commander'
import db, { stripeCustomers } from 'spackle-db'
import { eq } from 'drizzle-orm'

program.argument('<customer_id>', 'The stripe customer to sync')
program.parse()

const [customerId] = program.args

async function main(customerId: string) {
  const result = await db
    .select({ stripeAccountId: stripeCustomers.stripeAccountId })
    .from(stripeCustomers)
    .where(eq(stripeCustomers.stripeId, customerId))
  const { stripeAccountId } = result[0]
  await storeCustomerState(stripeAccountId, customerId)
  process.exit(0)
}

main(customerId)
