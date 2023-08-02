import { CustomerState } from '@/types'
import db, {
  customerFeatures,
  features,
  priceFeatures,
  productFeatures,
  stripePrices,
  stripeProducts,
  stripeSubscriptionItems,
  stripeSubscriptions,
} from 'spackle-db'
import { and, eq, inArray, ne } from 'drizzle-orm'

export const getAccountFeaturesState = async (stripeAccountId: string) => {
  const result = await db
    .select({
      id: features.id,
      name: features.name,
      key: features.key,
      type: features.type,
      value_flag: features.valueFlag,
      value_limit: features.valueLimit,
    })
    .from(features)
    .where(eq(features.stripeAccountId, stripeAccountId))
    .orderBy(features.name)

  return result || []
}

export const getProductFeaturesState = async (
  stripeAccountId: string,
  stripeProductId: string,
): Promise<any[]> => {
  const accountState = await getAccountFeaturesState(stripeAccountId)
  const result = await db
    .select({
      id: productFeatures.id,
      value_flag: productFeatures.valueFlag,
      value_limit: productFeatures.valueLimit,
      feature_id: productFeatures.featureId,
      name: features.name,
    })
    .from(productFeatures)
    .leftJoin(features, eq(productFeatures.featureId, features.id))
    .where(
      and(
        eq(productFeatures.stripeAccountId, stripeAccountId),
        eq(productFeatures.stripeProductId, stripeProductId),
      ),
    )

  const productFeaturesMap: { [key: string]: any } =
    result?.reduce(
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
  stripeAccountId: string,
  stripeProductId: string,
  stripePriceId: string,
): Promise<any[]> => {
  const productState = await getProductFeaturesState(
    stripeAccountId,
    stripeProductId,
  )
  const result = await db
    .select({
      id: priceFeatures.id,
      value_flag: priceFeatures.valueFlag,
      value_limit: priceFeatures.valueLimit,
      feature_id: priceFeatures.featureId,
      name: features.name,
    })
    .from(priceFeatures)
    .leftJoin(features, eq(priceFeatures.featureId, features.id))
    .where(
      and(
        eq(priceFeatures.stripeAccountId, stripeAccountId),
        eq(priceFeatures.stripePriceId, stripePriceId),
      ),
    )

  const priceFeaturesMap: { [key: string]: any } =
    result?.reduce(
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
  stripeAccountId: string,
  stripeCustomerId: string,
) => {
  const items = await db
    .select({
      stripePriceId: stripeSubscriptionItems.stripePriceId,
      stripeSubscriptions,
      stripePrices,
    })
    .from(stripeSubscriptionItems)
    .leftJoin(
      stripeSubscriptions,
      eq(
        stripeSubscriptionItems.stripeSubscriptionId,
        stripeSubscriptions.stripeId,
      ),
    )
    .leftJoin(
      stripePrices,
      eq(stripeSubscriptionItems.stripePriceId, stripePrices.stripeId),
    )
    .where(
      and(
        eq(stripeSubscriptionItems.stripeAccountId, stripeAccountId),
        eq(stripeSubscriptions.stripeCustomerId, stripeCustomerId),
      ),
    )

  const accountState = await getAccountFeaturesState(stripeAccountId)
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
        (item.stripeSubscriptions as any).status,
      )
    ) {
      const state = await getPriceFeaturesState(
        stripeAccountId,
        item.stripePrices?.stripeProductId!,
        item.stripePriceId,
      )
      priceStates.push(state)
    }
  }

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
        (feature.value_limit >= stale.value_limit ||
          feature.value_limit === null) // null means an unlimited feature
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
  stripeAccountId: string,
  stripeCustomerId: string,
): Promise<any[]> => {
  const subscriptionsState = await getSubscriptionFeaturesState(
    stripeAccountId,
    stripeCustomerId,
  )

  const result = await db
    .select({
      id: customerFeatures.id,
      value_flag: customerFeatures.valueFlag,
      value_limit: customerFeatures.valueLimit,
      feature_id: customerFeatures.featureId,
      name: features.name,
    })
    .from(customerFeatures)
    .leftJoin(features, eq(customerFeatures.featureId, features.id))
    .where(
      and(
        eq(customerFeatures.stripeAccountId, stripeAccountId),
        eq(customerFeatures.stripeCustomerId, stripeCustomerId),
      ),
    )

  const customerFeaturesMap: { [key: string]: any } =
    result?.reduce(
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
  stripeAccountId: string,
  stripeCustomerId: string,
) => {
  const subscriptionsData = await db
    .select({
      stripe_json: stripeSubscriptions.stripeJson,
    })
    .from(stripeSubscriptions)
    .where(
      and(
        eq(stripeSubscriptions.stripeAccountId, stripeAccountId),
        eq(stripeSubscriptions.stripeCustomerId, stripeCustomerId),
        ne(stripeSubscriptions.status, 'canceled'),
      ),
    )

  if (!subscriptionsData.length) {
    return []
  }

  const subscriptions = subscriptionsData.map((item: any) => item.stripe_json)

  const productIds = []
  for (const subscription of subscriptions) {
    for (const item of subscription.items.data) {
      productIds.push(item.price.product)
    }
  }

  const productsData = await db
    .select({ stripe_json: stripeProducts.stripeJson })
    .from(stripeProducts)
    .where(
      and(
        eq(stripeProducts.stripeAccountId, stripeAccountId),
        inArray(stripeProducts.stripeId, productIds),
      ),
    )

  const products = productsData.map((item: any) => item.stripe_json)
  console.log(products)
  const productsMap = products.reduce((a, v) => {
    a[v.id] = v
    return a
  }, {})

  for (const subscription of subscriptions) {
    for (const item of subscription.items.data) {
      const product = productsMap[item.price.product]
      item.price.product = product
    }
  }

  return subscriptions
}

export const getCustomerState = async (
  accountId: string,
  customerId: string,
): Promise<CustomerState> => {
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
