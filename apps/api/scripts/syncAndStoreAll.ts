import { storeAccountStates } from '@/store/dynamodb'
import supabase from 'spackle-supabase'
import { syncAllAccountData } from '../src/stripe/sync'

async function main() {
  const { data } = await supabase.from('stripe_accounts').select('stripe_id')

  if (!data) {
    return
  }

  for (const { stripe_id } of data) {
    let retries = 0
    while (retries < 3) {
      try {
        console.log(`Syncing ${stripe_id}...`)
        await syncAllAccountData(stripe_id)
        console.log(`Storing ${stripe_id}...`)
        await storeAccountStates(stripe_id)
        break
      } catch (e) {
        console.error(e)
        retries++
        continue
      }
    }
  }
}

main()
