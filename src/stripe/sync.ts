import stripe from '.'
import { supabase } from '../supabase/client'

export const syncStripeAccount = async (id: string) => {
  const stripeAccount = await stripe.accounts.retrieve(id)

  return await supabase.from('stripe_accounts').upsert(
    {
      stripe_id: stripeAccount.id,
      stripe_json: JSON.stringify(stripeAccount),
    },
    { onConflict: 'stripe_id' },
  )
}

export const syncStripeProduct = async (account_id: string, id: string) => {
  const stripeProduct = await stripe.products.retrieve(id, {
    stripeAccount: account_id,
  })

  return await supabase.from('stripe_products').upsert(
    {
      stripe_id: stripeProduct.id,
      stripe_account_id: account_id,
      stripe_json: JSON.stringify(stripeProduct),
    },
    { onConflict: 'stripe_id' },
  )
}

export const syncStripePrice = async (account_id: string, id: string) => {
  const stripePrice = await stripe.prices.retrieve(id, {
    stripeAccount: account_id,
  })

  return await supabase.from('stripe_prices').upsert(
    {
      stripe_id: stripePrice.id,
      stripe_account_id: account_id,
      stripe_json: JSON.stringify(stripePrice),
      stripe_product_id: stripePrice.product,
    },
    { onConflict: 'stripe_id' },
  )
}
