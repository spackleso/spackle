import { track } from '@/posthog'
import supabase, { SupabaseError } from 'spackle-supabase'

export const getStripeAccount = async (stripe_id: string) => {
  const { data, error } = await supabase
    .from('stripe_accounts')
    .select('*')
    .eq('stripe_id', stripe_id)
    .single()

  if (error) throw new SupabaseError(error)
  return data
}

export const upsertStripeAccount = async (
  stripe_id: string,
  name: string | undefined | null,
) => {
  const insert: any = {
    stripe_id,
    stripe_json: {},
  }

  if (name) {
    insert.name = name
  }

  const { data, error } = await supabase
    .from('stripe_accounts')
    .upsert(insert, { onConflict: 'stripe_id' })
    .select()
    .maybeSingle()

  if (error) throw new SupabaseError(error)
  return data
}

export const upsertStripeUser = async (
  stripe_account_id: string,
  stripe_id: string,
  email?: string | null,
  name?: string | null,
) => {
  const insert: any = {
    stripe_account_id,
    stripe_id,
  }

  if (email) {
    insert.email = email
  }

  if (name) {
    insert.name = name
  }

  const { data, error } = await supabase
    .from('stripe_users')
    .select('*')
    .eq('stripe_account_id', stripe_account_id)
    .eq('stripe_id', stripe_id)
    .maybeSingle()

  if (error) throw new SupabaseError(error)

  if (data) {
    const { data: updateData, error: updateError } = await supabase
      .from('stripe_users')
      .update(insert)
      .eq('stripe_account_id', stripe_account_id)
      .eq('stripe_id', stripe_id)
      .select()
      .single()

    if (updateError) throw new SupabaseError(updateError)
    return updateData
  } else {
    const { data: insertData, error: insertError } = await supabase
      .from('stripe_users')
      .insert(insert)
      .select()
      .single()

    if (insertError) throw new SupabaseError(insertError)

    await track(insertData.id.toString(), 'New user', {
      email: insertData.email,
      name: insertData.name,
      stripe_id: insertData.stripe_id,
    })
    return insertData
  }
}

export const getStripeProduct = async (
  stripe_account_id: string,
  stripe_id: string,
) => {
  const { data, error } = await supabase
    .from('stripe_products')
    .select('*')
    .eq('stripe_account_id', stripe_account_id)
    .eq('stripe_id', stripe_id)
    .maybeSingle()

  if (error) throw error
  return data
}

export const upsertStripeProduct = async (
  stripe_account_id: string,
  stripe_id: string,
  stripe_json: string,
) => {
  const { data, error } = await supabase
    .from('stripe_products')
    .upsert(
      {
        stripe_id,
        stripe_account_id,
        stripe_json,
      },
      { onConflict: 'stripe_id' },
    )
    .select()

  if (error) throw new SupabaseError(error)
  return data
}

export const getStripePrice = async (
  stripe_account_id: string,
  stripe_id: string,
) => {
  const { data, error } = await supabase
    .from('stripe_prices')
    .select('*')
    .eq('stripe_account_id', stripe_account_id)
    .eq('stripe_id', stripe_id)
    .single()

  if (error) throw new SupabaseError(error)
  return data
}

export const upsertStripePrice = async (
  stripe_account_id: string,
  stripe_id: string,
  stripe_product_id: string,
  stripe_json: string,
) => {
  const { data, error } = await supabase
    .from('stripe_prices')
    .upsert(
      {
        stripe_id,
        stripe_account_id,
        stripe_product_id,
        stripe_json,
      },
      { onConflict: 'stripe_id' },
    )
    .select()
    .maybeSingle()

  if (error) throw new SupabaseError(error)
  return data
}

export const getStripeCustomer = async (
  stripe_account_id: string,
  stripe_id: string,
) => {
  const { data, error } = await supabase
    .from('stripe_customers')
    .select('*')
    .eq('stripe_account_id', stripe_account_id)
    .eq('stripe_id', stripe_id)
    .single()

  if (error) throw new SupabaseError(error)
  return data
}

export const upsertStripeCustomer = async (
  stripe_account_id: string,
  stripe_id: string,
  stripe_json: string,
) => {
  const { data, error } = await supabase
    .from('stripe_customers')
    .upsert(
      {
        stripe_id,
        stripe_account_id,
        stripe_json,
      },
      { onConflict: 'stripe_id' },
    )
    .select()
    .maybeSingle()

  if (error) throw new SupabaseError(error)
  return data
}

export const deleteStripeCustomer = async (
  stripe_account_id: string,
  stripe_id: string,
) => {
  const { data, error } = await supabase
    .from('stripe_customers')
    .delete()
    .eq('stripe_account_id', stripe_account_id)
    .eq('stripe_id', stripe_id)

  if (error) throw new SupabaseError(error)
  return data
}

export const upsertStripeSubscription = async (
  stripe_account_id: string,
  stripe_id: string,
  stripe_customer_id: string,
  status: string,
  stripe_json: string,
) => {
  const { data, error } = await supabase
    .from('stripe_subscriptions')
    .upsert(
      {
        stripe_id,
        stripe_account_id,
        stripe_customer_id,
        stripe_json,
        status,
      },
      { onConflict: 'stripe_id' },
    )
    .select()
    .maybeSingle()

  if (error) throw new SupabaseError(error)
  return data
}

export const deleteStripeSubscription = async (
  stripe_account_id: string,
  stripe_id: string,
) => {
  const { data, error } = await supabase
    .from('stripe_subscriptions')
    .delete()
    .eq('stripe_account_id', stripe_account_id)
    .eq('stripe_id', stripe_id)

  if (error) throw new SupabaseError(error)
  return data
}

export const upsertStripeSubscriptionItem = async (
  stripe_account_id: string,
  stripe_id: string,
  stripe_price_id: string,
  stripe_subscription_id: string,
  stripe_json: string,
) => {
  const { data, error } = await supabase
    .from('stripe_subscription_items')
    .upsert(
      {
        stripe_id,
        stripe_account_id,
        stripe_json,
        stripe_price_id,
        stripe_subscription_id,
      },
      { onConflict: 'stripe_id' },
    )
    .select()
    .maybeSingle()

  if (error) throw new SupabaseError(error)
  return data
}
