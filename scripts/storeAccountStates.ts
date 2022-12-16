import { storeAccountStates } from '../src/store/upstash'
import { program } from 'commander'

program.argument('<account_id>', 'The stripe account to sync')
program.parse()

const [accountId] = program.args

async function main(accountId: string) {
  await storeAccountStates(accountId)
}

main(accountId)
