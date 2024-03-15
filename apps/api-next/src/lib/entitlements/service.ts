import { Database, schema } from '@spackle/db'
import { eq, and, ne, inArray } from '@spackle/db'

export type CustomerState = {
  version: number
  features: any[]
  subscriptions: any[]
}

export class EntitlementsService {
  private readonly db: Database

  constructor(db: Database) {
    this.db = db
  }

  async getAccountFeaturesState(stripeAccountId: string) {
    const result = await this.db
      .select({
        id: schema.features.id,
        name: schema.features.name,
        key: schema.features.key,
        type: schema.features.type,
        value_flag: schema.features.valueFlag,
        value_limit: schema.features.valueLimit,
      })
      .from(schema.features)
      .where(eq(schema.features.stripeAccountId, stripeAccountId))
      .orderBy(schema.features.name)

    return result || []
  }

  async getProductFeaturesState(
    stripeAccountId: string,
    stripeProductId: string,
  ): Promise<any[]> {
    const accountState = await this.getAccountFeaturesState(stripeAccountId)
    const result = await this.db
      .select({
        id: schema.productFeatures.id,
        value_flag: schema.productFeatures.valueFlag,
        value_limit: schema.productFeatures.valueLimit,
        feature_id: schema.productFeatures.featureId,
        name: schema.features.name,
      })
      .from(schema.productFeatures)
      .leftJoin(
        schema.features,
        eq(schema.productFeatures.featureId, schema.features.id),
      )
      .where(
        and(
          eq(schema.productFeatures.stripeAccountId, stripeAccountId),
          eq(schema.productFeatures.stripeProductId, stripeProductId),
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

  async getSubscriptionFeaturesState(
    stripeAccountId: string,
    stripeCustomerId: string,
  ) {
    const items = await this.db
      .select({
        stripePriceId: schema.stripeSubscriptionItems.stripePriceId,
        stripeSubscriptions: schema.stripeSubscriptions,
        stripePrices: schema.stripePrices,
      })
      .from(schema.stripeSubscriptionItems)
      .leftJoin(
        schema.stripeSubscriptions,
        eq(
          schema.stripeSubscriptionItems.stripeSubscriptionId,
          schema.stripeSubscriptions.stripeId,
        ),
      )
      .leftJoin(
        schema.stripePrices,
        eq(
          schema.stripeSubscriptionItems.stripePriceId,
          schema.stripePrices.stripeId,
        ),
      )
      .where(
        and(
          eq(schema.stripeSubscriptionItems.stripeAccountId, stripeAccountId),
          eq(schema.stripeSubscriptions.stripeCustomerId, stripeCustomerId),
        ),
      )

    const accountState = await this.getAccountFeaturesState(stripeAccountId)
    const accountMap: { [key: string]: any } =
      accountState?.reduce(
        (a, v) => ({
          ...a,
          [v.id]: v,
        }),
        {},
      ) || {}

    const productStates = []
    for (const item of items!) {
      if (
        ['active', 'past_due', 'incomplete', 'trialing'].includes(
          (item.stripeSubscriptions as any).status,
        )
      ) {
        const state = await this.getProductFeaturesState(
          stripeAccountId,
          item.stripePrices?.stripeProductId!,
        )
        productStates.push(state)
      }
    }

    const productMap = productStates.reduce((a, v) => {
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

    return Object.values(productMap)
  }

  async getCustomerFeaturesState(
    stripeAccountId: string,
    stripeCustomerId: string,
  ): Promise<any[]> {
    const subscriptionsState = await this.getSubscriptionFeaturesState(
      stripeAccountId,
      stripeCustomerId,
    )

    const result = await this.db
      .select({
        id: schema.customerFeatures.id,
        value_flag: schema.customerFeatures.valueFlag,
        value_limit: schema.customerFeatures.valueLimit,
        feature_id: schema.customerFeatures.featureId,
        name: schema.features.name,
      })
      .from(schema.customerFeatures)
      .leftJoin(
        schema.features,
        eq(schema.customerFeatures.featureId, schema.features.id),
      )
      .where(
        and(
          eq(schema.customerFeatures.stripeAccountId, stripeAccountId),
          eq(schema.customerFeatures.stripeCustomerId, stripeCustomerId),
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

  async getCustomerSubscriptionsState(
    stripeAccountId: string,
    stripeCustomerId: string,
  ) {
    const subscriptionsData = await this.db
      .select({
        stripe_json: schema.stripeSubscriptions.stripeJson,
      })
      .from(schema.stripeSubscriptions)
      .where(
        and(
          eq(schema.stripeSubscriptions.stripeAccountId, stripeAccountId),
          eq(schema.stripeSubscriptions.stripeCustomerId, stripeCustomerId),
          ne(schema.stripeSubscriptions.status, 'canceled'),
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

    const productsData = await this.db
      .select({ stripe_json: schema.stripeProducts.stripeJson })
      .from(schema.stripeProducts)
      .where(
        and(
          eq(schema.stripeProducts.stripeAccountId, stripeAccountId),
          inArray(schema.stripeProducts.stripeId, productIds),
        ),
      )

    const products = productsData.map((item: any) => item.stripe_json)
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

  getCustomerState = async (
    accountId: string,
    customerId: string,
  ): Promise<CustomerState> => {
    const subscriptions = await this.getCustomerSubscriptionsState(
      accountId,
      customerId,
    )
    const features = await this.getCustomerFeaturesState(accountId, customerId)
    return {
      version: 1,
      features,
      subscriptions,
    }
  }
}
