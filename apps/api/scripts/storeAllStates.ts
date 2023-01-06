import supabase from 'spackle-supabase'
import { storeAccountStates } from '../src/store/dynamodb'

async function main() {
  const { data } = await supabase.from('stripe_accounts').select('stripe_id')

  if (!data) {
    return
  }

  const promises = []
  for (const { stripe_id } of data) {
    console.log(`Storing ${stripe_id}...`)
    promises.push(storeAccountStates(stripe_id))
  }
  await Promise.all(promises)
}

main()
