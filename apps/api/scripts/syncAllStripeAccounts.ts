import supabase from 'spackle-supabase'
import { syncAllAccountData } from '../src/stripe/sync'

async function main() {
  const { data } = await supabase.from('stripe_accounts').select('stripe_id')

  if (!data) {
    return
  }

  for (const { stripe_id } of data) {
    await syncAllAccountData(stripe_id)
  }
}

main()
