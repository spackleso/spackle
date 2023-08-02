import { storeAccountStates } from '../src/store/dynamodb'
import { program } from 'commander'

program.argument('<account_id>', 'The stripe account to sync')
program.parse()

const [accountId] = program.args

async function main(accountId: string) {
  await storeAccountStates(accountId)
  process.exit(0)
}

main(accountId)
