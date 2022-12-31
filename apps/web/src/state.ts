import { supabase, SupabaseError } from './supabase'

export const getAccountFeaturesState = async (accountId: string) => {
  const { data, error } = await supabase
    .from('features')
    .select('id,name,key,type,value_flag,value_limit')
    .eq('stripe_account_id', accountId)
    .order('name', { ascending: true })

  if (error) {
    throw new SupabaseError(error)
  }

  return data || []
}

export const getProductFeaturesState = async (
  accountId: string,
  productId: string,
): Promise<any[]> => {
  const accountState = await getAccountFeaturesState(accountId)

  const { data: productFeatures, error: productFeaturesError } = await supabase
    .from('product_features')
    .select('id,value_flag,value_limit,feature_id,features(name)')
    .eq('stripe_account_id', accountId)
    .eq('stripe_product_id', productId)

  if (productFeaturesError) {
    throw new SupabaseError(productFeaturesError)
  }

  const productFeaturesMap: { [key: string]: any } =
    productFeatures?.reduce(
      (a, v) => ({
        ...a,
        [v.feature_id]: v,
      }),
      {},
    ) || {}

  return (
    accountState?.map((f) => {
      const productFeature = productFeaturesMap[f.id]
      if (productFeature) {
        return {
          ...f,
          value_flag: productFeature.value_flag,
          value_limit: productFeature.value_limit,
        }
      }
      return f
    }) || []
  )
}

export const getPriceFeaturesState = async (
  accountId: string,
  productId: string,
  priceId: string,
): Promise<any[]> => {
  const productState = await getProductFeaturesState(accountId, productId)

  const { data: priceFeatures, error: productFeaturesError } = await supabase
    .from('price_features')
    .select('id,value_flag,value_limit,feature_id,features(name)')
    .eq('stripe_account_id', accountId)
    .eq('stripe_price_id', priceId)

  if (productFeaturesError) {
    throw new SupabaseError(productFeaturesError)
  }

  const priceFeaturesMap: { [key: string]: any } =
    priceFeatures?.reduce(
      (a, v) => ({
        ...a,
        [v.feature_id]: v,
      }),
      {},
    ) || {}

  return (
    productState?.map((f) => {
      const priceFeature = priceFeaturesMap[f.id]
      if (priceFeature) {
        return {
          ...f,
          value_flag: priceFeature.value_flag,
          value_limit: priceFeature.value_limit,
        }
      }
      return f
    }) || []
  )
}

export const getSubscriptionFeaturesState = async (
  accountId: string,
  customerId: string,
) => {
  const { data: items, error } = await supabase
    .from('stripe_subscription_items')
    .select(
      'stripe_price_id, stripe_subscriptions!inner(*), stripe_prices!inner(*)',
    )
    .eq('stripe_account_id', accountId)
    .eq('stripe_subscriptions.stripe_customer_id', customerId)

  if (error) {
    throw new SupabaseError(error)
  }

  const accountState = await getAccountFeaturesState(accountId)
  const accountMap: { [key: string]: any } =
    accountState?.reduce(
      (a, v) => ({
        ...a,
        [v.id]: v,
      }),
      {},
    ) || {}

  const priceStates = []
  for (const item of items!) {
    if (
      ['active', 'past_due', 'incomplete', 'trialing'].includes(
        (item.stripe_subscriptions as any).status,
      )
    ) {
      const state = await getPriceFeaturesState(
        accountId,
        (item.stripe_prices as any).stripe_product_id,
        item.stripe_price_id,
      )
      priceStates.push(state)
    }
  }

  // TODO: test
  const priceMap = priceStates.reduce((a, v) => {
    for (const feature of v) {
      const stale = a[feature.id]
      if (!stale) {
        a = {
          ...a,
          [feature.id]: feature,
        }
      } else if (feature.type === 0 && feature.value_flag) {
        a = {
          ...a,
          [feature.id]: feature,
        }
      } else if (
        feature.type === 1 &&
        feature.value_limit >= stale.value_limit
      ) {
        a = {
          ...a,
          [feature.id]: feature,
        }
      }
    }
    return a
  }, accountMap)

  return Object.values(priceMap)
}

export const getCustomerFeaturesState = async (
  accountId: string,
  customerId: string,
): Promise<any[]> => {
  const subscriptionsState = await getSubscriptionFeaturesState(
    accountId,
    customerId,
  )

  const { data: customerFeatures, error: customerFeaturesError } =
    await supabase
      .from('customer_features')
      .select('id,value_flag,value_limit,feature_id,features(name)')
      .eq('stripe_account_id', accountId)
      .eq('stripe_customer_id', customerId)

  if (customerFeaturesError) {
    throw new SupabaseError(customerFeaturesError)
  }

  const customerFeaturesMap: { [key: string]: any } =
    customerFeatures?.reduce(
      (a, v) => ({
        ...a,
        [v.feature_id]: v,
      }),
      {},
    ) || {}

  return (
    subscriptionsState?.map((f) => {
      const customerFeature = customerFeaturesMap[f.id]
      if (customerFeature) {
        return {
          ...f,
          value_flag: customerFeature.value_flag,
          value_limit: customerFeature.value_limit,
        }
      }
      return f
    }) || []
  )
}

export const getCustomerSubscriptionsState = async (
  accountId: string,
  customerId: string,
) => {
  const { data, error } = await supabase
    .from('stripe_subscription_items')
    .select(
      `
        stripe_subscriptions!inner(
          *
        ),
        stripe_prices!inner(
          stripe_json,
          stripe_products!inner(
            stripe_json
          )
        )
      `,
    )
    .eq('stripe_account_id', accountId)
    .eq('stripe_subscriptions.stripe_customer_id', customerId)

  if (error) {
    throw new SupabaseError(error)
  }

  return data.map((item: any) => ({
    id: item.stripe_subscriptions.stripe_id,
    product: JSON.parse(item.stripe_prices.stripe_products.stripe_json),
    price: JSON.parse(item.stripe_prices.stripe_json),
    status: item.stripe_subscriptions.status,
  }))
}

export const getCustomerState = async (
  accountId: string,
  customerId: string,
) => {
  const subscriptions = await getCustomerSubscriptionsState(
    accountId,
    customerId,
  )
  const features = await getCustomerFeaturesState(accountId, customerId)
  return {
    version: 1,
    features,
    subscriptions,
  }
}