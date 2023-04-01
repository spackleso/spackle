import supabase from 'spackle-supabase'
import { storeAccountStates } from '../src/store/dynamodb'

async function main() {
  const { data } = await supabase.from('stripe_accounts').select('stripe_id')

  if (!data) {
    return
  }

  for (const { stripe_id } of data) {
    console.log(`Storing ${stripe_id}...`)
    await storeAccountStates(stripe_id)
  }
}

main()
