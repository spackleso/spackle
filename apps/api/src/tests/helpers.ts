import crypto from 'crypto'
import { execSync } from 'child_process'
import { createToken } from '@/api'
import db, {
  customerFeatures,
  features,
  priceFeatures,
  productFeatures,
  stripeAccounts,
  stripeCustomers,
  stripePrices,
  stripeProducts,
  stripeSubscriptionItems,
  stripeSubscriptions,
  stripeUsers,
} from 'spackle-db'
import { NextApiHandler, NextApiRequest, NextApiResponse } from 'next'
import { createRequest, createResponse, RequestOptions } from 'node-mocks-http'
import { liveStripe as stripe } from '@/stripe'

export type ApiRequest = NextApiRequest & ReturnType<typeof createRequest>
export type ApiResponse = NextApiResponse & ReturnType<typeof createResponse>

export const testHandler = async (
  handler: NextApiHandler,
  options: RequestOptions,
) => {
  const req = createRequest<ApiRequest>(options)
  const res = createResponse<ApiResponse>()

  await handler(req, res)
  return res
}

export const stripeTestHandler = async (
  handler: NextApiHandler,
  options: RequestOptions,
) => {
  options = {
    ...options,
    headers: {
      ...options.headers,
      'Stripe-Signature': stripe.webhooks.generateTestHeaderString({
        payload: JSON.stringify(options.body),
        secret: process.env.STRIPE_SIGNING_SECRET ?? '',
      }),
    },
  }

  return await testHandler(handler, options)
}

export const initializeTestDatabase = async () => {
  execSync('supabase db reset')
}

export const genStripeId = (prefix: string) => {
  return `${prefix}_${crypto.randomBytes(16).toString('hex')}`
}

export const createAccount = async () => {
  const stripeId = genStripeId('acct')
  const result = await db
    .insert(stripeAccounts)
    .values({
      stripeId,
    })
    .returning()
  return result[0]
}

export const createUser = async (stripeAccountId: string) => {
  const stripeId = genStripeId('usr')
  const result = await db
    .insert(stripeUsers)
    .values({
      stripeId,
      stripeAccountId,
    })
    .returning()
  return result[0]
}

export const createStripeCustomer = async (stripeAccountId: string) => {
  const stripeId = genStripeId('cust')
  const result = await db
    .insert(stripeCustomers)
    .values({
      stripeId,
      stripeAccountId,
      stripeJson: JSON.stringify({
        id: stripeId,
      }),
    })
    .returning()
  return result[0]
}

export const createStripeProduct = async (stripeAccountId: string) => {
  const stripeId = genStripeId('prod')
  const result = await db
    .insert(stripeProducts)
    .values({
      stripeAccountId,
      stripeId,
      stripeJson: JSON.stringify({
        id: stripeId,
      }),
    })
    .returning()
  return result[0]
}

export const createStripePrice = async (
  stripeAccountId: string,
  stripeProductId: string,
) => {
  const stripeId = genStripeId('price')
  const result = await db
    .insert(stripePrices)
    .values({
      stripeAccountId,
      stripeProductId,
      stripeId,
      stripeJson: JSON.stringify({
        id: stripeId,
      }),
    })
    .returning()
  return result[0]
}

export const createAccountWithToken = async () => {
  const account = await createAccount()
  const token = await createToken(account.stripeId)

  return {
    account,
    token,
  }
}

export const createStripeSubscription = async (
  stripeAccountId: string,
  stripeCustomerId: string,
  stripePriceId: string,
  stripeJson: string,
  stripeId: string = genStripeId('sub'),
  siId: string = genStripeId('si'),
) => {
  const subs = await db
    .insert(stripeSubscriptions)
    .values({
      status: 'active',
      stripeAccountId,
      stripeCustomerId,
      stripeId,
      stripeJson,
    })
    .returning()

  const res = await db
    .insert(stripeSubscriptionItems)
    .values({
      stripeAccountId,
      stripeId: siId,
      stripePriceId,
      stripeSubscriptionId: subs[0].stripeId,
    })
    .returning()

  return subs[0]
}

export const createFlagFeature = async (
  stripeAccountId: string,
  name: string,
  key: string,
  valueFlag: boolean,
) => {
  const result = await db
    .insert(features)
    .values({
      name,
      key,
      type: 0,
      valueFlag,
      stripeAccountId,
    })
    .returning()
  return result[0]
}

export const createLimitFeature = async (
  stripeAccountId: string,
  name: string,
  key: string,
  valueLimit: number,
) => {
  const result = await db
    .insert(features)
    .values({
      name,
      key,
      type: 1,
      valueLimit: valueLimit.toString(),
      stripeAccountId,
    })
    .returning()
  return result[0]
}

export const createProductFeature = async (
  stripeAccountId: string,
  name: string,
  key: string,
  valueFlag: boolean,
  product?: any,
) => {
  const feature = await createFlagFeature(stripeAccountId, name, key, valueFlag)

  if (!product) {
    product = await createStripeProduct(stripeAccountId)
  }

  const result = await db
    .insert(productFeatures)
    .values({
      stripeAccountId,
      featureId: feature.id,
      stripeProductId: product.stripeId,
      valueFlag,
    })
    .returning()
  return result[0]
}

export const createPriceFeature = async (
  stripeAccountId: string,
  name: string,
  key: string,
  valueFlag: boolean,
  price?: any,
) => {
  const feature = await createFlagFeature(stripeAccountId, name, key, valueFlag)
  const product = await createStripeProduct(stripeAccountId)

  if (!price) {
    price = await createStripePrice(stripeAccountId, product.stripeId)
  }

  const result = await db
    .insert(priceFeatures)
    .values({
      stripeAccountId,
      featureId: feature.id,
      stripePriceId: price.stripeId,
      valueFlag,
    })
    .returning()
  return result[0]
}

export const createCustomerFeature = async (
  stripeAccountId: string,
  name: string,
  key: string,
  valueFlag: boolean,
  customer?: any,
) => {
  const feature = await createFlagFeature(stripeAccountId, name, key, valueFlag)

  if (!customer) {
    customer = await createStripeCustomer(stripeAccountId)
  }

  const result = await db
    .insert(customerFeatures)
    .values({
      stripeAccountId,
      featureId: feature.id,
      stripeCustomerId: customer.stripeId,
      valueFlag,
    })
    .returning()
  return result[0]
}
