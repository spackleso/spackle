import { program } from 'commander'
import { getCustomerState } from '@/state'
import db, { stripeCustomers } from '@/db'
import { eq } from 'drizzle-orm'

program.argument('<customer_id>', 'The stripe customer to sync')
program.parse()

const [customerId] = program.args

async function main(customerId: string) {
  const result = await db
    .select({
      stripeAccountId: stripeCustomers.stripeAccountId,
    })
    .from(stripeCustomers)
    .where(eq(stripeCustomers.stripeId, customerId))
  const { stripeAccountId } = result[0]
  const state = await getCustomerState(stripeAccountId, customerId)
  console.log(state)
  process.exit(0)
}

main(customerId)
