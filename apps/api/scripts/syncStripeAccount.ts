import { syncAllAccountData } from '../src/stripe/sync'
import { program } from 'commander'

program.argument('<account_id>', 'The stripe account to sync')
program.parse()

const [accountId] = program.args

async function main(accountId: string) {
  await syncAllAccountData(accountId)
}

main(accountId)
