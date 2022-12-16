import { storeCustomerState } from '../src/store/upstash'
import { program } from 'commander'

program
  .argument('<account_id>', 'The stripe account to sync')
  .argument('<customer_id>', 'The stripe customer to sync')
program.parse()

const [accountId, customerId] = program.args

async function main(accountId: string, customerId: string) {
  await storeCustomerState(accountId, customerId)
}

main(accountId, customerId)
