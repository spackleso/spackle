import { storeCustomerState } from '../src/store/dynamodb'
import { program } from 'commander'
import { supabase } from '@/supabase'

program.argument('<customer_id>', 'The stripe customer to sync')
program.parse()

const [customerId] = program.args

async function main(customerId: string) {
  const { data } = await supabase
    .from('stripe_customers')
    .select('stripe_account_id')
    .eq('stripe_id', customerId)
    .maybeSingle()
  await storeCustomerState(data!.stripe_account_id, customerId)
}

main(customerId)
