import { program } from 'commander'
import { getCustomerState } from '@/state'
import supabase from 'spackle-supabase'

program.argument('<customer_id>', 'The stripe customer to sync')
program.parse()

const [customerId] = program.args

async function main(customerId: string) {
  const { data } = await supabase
    .from('stripe_customers')
    .select('stripe_account_id')
    .eq('stripe_id', customerId)
    .maybeSingle()
  const state = await getCustomerState(data!.stripe_account_id, customerId)
  console.log(state)
}

main(customerId)
