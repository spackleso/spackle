import stripe from '.'
import { supabase } from '../supabase'

const stripeSyncEndpoint = process.env.STRIPE_SYNC_ENDPOINT

export const syncStripeAccount = async (id: string) => {
  const stripeAccount = await stripe.accounts.retrieve(id)

  const response = await supabase
    .from('stripe_accounts')
    .upsert(
      {
        stripe_id: stripeAccount.id,
        stripe_json: JSON.stringify(stripeAccount),
      },
      { onConflict: 'stripe_id' },
    )
    .select()

  if (
    stripeSyncEndpoint &&
    response.data &&
    !response.data[0].initial_sync_complete
  ) {
    const payload = JSON.stringify({
      account_id: stripeAccount.id,
    })
    console.log(payload)
    await fetch(stripeSyncEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: payload,
    })
  }

  return response
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

export const syncStripeCustomer = async (account_id: string, id: string) => {
  const stripeCustomer = await stripe.customers.retrieve(id, {
    stripeAccount: account_id,
  })

  return await supabase.from('stripe_customers').upsert(
    {
      stripe_id: stripeCustomer.id,
      stripe_account_id: account_id,
      stripe_json: JSON.stringify(stripeCustomer),
    },
    { onConflict: 'stripe_id' },
  )
}

export const syncStripeSubscriptions = async (
  account_id: string,
  customer_id: string,
) => {
  for await (const subscription of stripe.subscriptions.list(
    {
      customer: customer_id,
    },
    {
      stripeAccount: account_id,
    },
  )) {
    await supabase.from('stripe_subscriptions').upsert(
      {
        stripe_id: subscription.id,
        stripe_account_id: account_id,
        stripe_customer_id: subscription.customer,
        stripe_json: JSON.stringify(subscription),
        status: subscription.status,
      },
      { onConflict: 'stripe_id' },
    )

    await syncStripeSubscriptionItems(account_id, subscription.id)
  }
}

export const syncStripeSubscriptionItems = async (
  account_id: string,
  subscription_id: string,
) => {
  for await (const subscriptionItem of stripe.subscriptionItems.list(
    {
      subscription: subscription_id,
    },
    {
      stripeAccount: account_id,
    },
  )) {
    await supabase.from('stripe_subscription_items').upsert(
      {
        stripe_id: subscriptionItem.id,
        stripe_account_id: account_id,
        stripe_json: JSON.stringify(subscriptionItem),
        stripe_price_id: subscriptionItem.price.id,
        stripe_subscription_id: subscriptionItem.subscription,
      },
      { onConflict: 'stripe_id' },
    )
  }
}

export const syncAllAccountData = async (account_id: string) => {
  // TODO: the creation is reall inefficient as it stands

  console.log(`Syncing account ${account_id}`)
  const { data, error } = await syncStripeAccount(account_id)

  // Customers
  for await (const stripeCustomer of stripe.customers.list({
    stripeAccount: account_id,
  })) {
    console.log(`Syncing customer ${stripeCustomer.id}`)
    const { data, error } = await supabase.from('stripe_customers').upsert(
      {
        stripe_id: stripeCustomer.id,
        stripe_account_id: account_id,
        stripe_json: JSON.stringify(stripeCustomer),
      },
      { onConflict: 'stripe_id' },
    )
    console.log(error)
  }

  // Products
  for await (const stripeProduct of stripe.products.list({
    stripeAccount: account_id,
  })) {
    console.log(`Syncing product ${stripeProduct.id}`)
    const { data, error } = await supabase.from('stripe_products').upsert(
      {
        stripe_id: stripeProduct.id,
        stripe_account_id: account_id,
        stripe_json: JSON.stringify(stripeProduct),
      },
      { onConflict: 'stripe_id' },
    )
    console.log(error)
  }

  // Prices
  for await (const stripePrice of stripe.prices.list({
    stripeAccount: account_id,
  })) {
    console.log(`Syncing price ${stripePrice.id}`)
    const { data, error } = await supabase.from('stripe_prices').upsert(
      {
        stripe_id: stripePrice.id,
        stripe_account_id: account_id,
        stripe_json: JSON.stringify(stripePrice),
        stripe_product_id: stripePrice.product,
      },
      { onConflict: 'stripe_id' },
    )
    console.log(error)
  }

  // Subscriptions & Subscription Items
  for await (const stripeSubscription of stripe.subscriptions.list({
    stripeAccount: account_id,
  })) {
    console.log(`Syncing subscription ${stripeSubscription.id}`)
    const { data, error } = await supabase.from('stripe_subscriptions').upsert(
      {
        stripe_id: stripeSubscription.id,
        stripe_account_id: account_id,
        stripe_customer_id: stripeSubscription.customer,
        stripe_json: JSON.stringify(stripeSubscription),
        status: stripeSubscription.status,
      },
      { onConflict: 'stripe_id' },
    )
    await syncStripeSubscriptionItems(account_id, stripeSubscription.id)
  }

  await supabase
    .from('stripe_accounts')
    .update({
      initial_sync_complete: true,
    })
    .eq('stripe_id', account_id)
}
