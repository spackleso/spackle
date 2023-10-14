import crypto from 'crypto'
import { execSync } from 'child_process'
import { createPublishableToken, createToken } from '@/api'
import db, {
  customerFeatures,
  encodePk,
  features,
  pricingTableProducts,
  pricingTables,
  productFeatures,
  stripeAccounts,
  stripeCharges,
  stripeCustomers,
  stripeInvoices,
  stripePrices,
  stripeProducts,
  stripeSubscriptionItems,
  stripeSubscriptions,
  stripeUsers,
} from '@/db'
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
      stripeJson: {
        id: stripeId,
      },
    })
    .returning()
  return result[0]
}

export const createStripeProduct = async (
  stripeAccountId: string,
  stripeJson?: any,
) => {
  const stripeId = genStripeId('prod')
  const result = await db
    .insert(stripeProducts)
    .values({
      stripeAccountId,
      stripeId,
      stripeJson: {
        ...stripeJson,
        id: stripeId,
      },
    })
    .returning()
  return result[0]
}

export const createStripePrice = async (
  stripeAccountId: string,
  stripeProductId: string,
  stripeJson?: any,
) => {
  const stripeId = genStripeId('price')
  const result = await db
    .insert(stripePrices)
    .values({
      stripeAccountId,
      stripeProductId,
      stripeId,
      stripeJson: {
        ...stripeJson,
        id: stripeId,
      },
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

export const createAccountWithPublishableToken = async () => {
  const account = await createAccount()
  const token = await createPublishableToken(account.stripeId)

  return {
    account,
    token,
  }
}

export const createStripeSubscription = async (
  stripeAccountId: string,
  stripeCustomerId: string,
  stripePriceId: string,
  stripeJson: any,
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
      valueLimit,
      stripeAccountId,
    })
    .returning()
  return result[0]
}

export const createProductFeature = async (
  stripeAccountId: string,
  valueFlag: boolean,
  opts: any,
) => {
  if (!opts.feature) {
    opts.feature = await createFlagFeature(
      stripeAccountId,
      opts.name,
      opts.key,
      false,
    )
  }

  if (!opts.product) {
    opts.product = await createStripeProduct(stripeAccountId)
  }

  const result = await db
    .insert(productFeatures)
    .values({
      stripeAccountId,
      featureId: opts.feature.id,
      stripeProductId: opts.product.stripeId,
      valueFlag,
    })
    .returning()
  return result[0]
}

export const createCustomerFlagFeature = async (
  stripeAccountId: string,
  name: string,
  key: string,
  valueFlag: boolean,
  customer?: any,
) => {
  const feature = await createFlagFeature(stripeAccountId, name, key, false)

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

export const createCustomerLimitFeature = async (
  stripeAccountId: string,
  name: string,
  key: string,
  valueLimit: number,
  customer?: any,
) => {
  const feature = await createFlagFeature(stripeAccountId, name, key, false)

  if (!customer) {
    customer = await createStripeCustomer(stripeAccountId)
  }

  const result = await db
    .insert(customerFeatures)
    .values({
      stripeAccountId,
      featureId: feature.id,
      stripeCustomerId: customer.stripeId,
      valueLimit,
    })
    .returning()
  return result[0]
}

export const createPricingTable = async (
  stripeAccountId: string,
  name: string,
  mode: number,
  monthlyEnabled: boolean,
  annualEnabled: boolean,
) => {
  const result = await db
    .insert(pricingTables)
    .values({
      stripeAccountId,
      name,
      mode,
      annualEnabled,
      monthlyEnabled,
    })
    .returning({
      id: pricingTables.id,
      encodedId: encodePk(pricingTables.id),
      name: pricingTables.name,
      mode: pricingTables.mode,
      monthlyEnabled: pricingTables.monthlyEnabled,
      annualEnabled: pricingTables.annualEnabled,
    })
  return result[0]
}

export const createPricingTableProduct = async (
  stripeAccountId: string,
  pricingTableId: number,
  stripeProductId: string,
  monthlyStripePriceId?: string | null,
  annualStripePriceId?: string | null,
) => {
  const result = await db
    .insert(pricingTableProducts)
    .values({
      stripeAccountId,
      pricingTableId,
      stripeProductId,
      monthlyStripePriceId,
      annualStripePriceId,
    })
    .returning()
  return result[0]
}

export const createStripeInvoice = async (
  stripeAccountId: string,
  stripeSubscriptionId: string | null,
  stripeJson: any,
  stripeId: string = genStripeId('inv'),
) => {
  const result = await db
    .insert(stripeInvoices)
    .values({
      stripeAccountId,
      stripeId,
      stripeSubscriptionId,
      stripeJson,
    })
    .returning()
  return result[0]
}

export const createStripeCharge = async (
  stripeAccountId: string,
  stripeJson: any,
  status: string,
  amount: number,
  stripeCreated: Date,
  stripeInvoiceId: string | null,
  mode: number,
  stripeId: string = genStripeId('ch'),
) => {
  const result = await db
    .insert(stripeCharges)
    .values({
      stripeId,
      stripeAccountId,
      stripeJson,
      status,
      amount,
      stripeCreated: stripeCreated.toISOString(),
      stripeInvoiceId,
      mode,
    })
    .returning()
  return result[0]
}

export const createsBillableCharge = async (
  stripeAccountId: string,
  amount: number,
  stripeCreatedDate: Date,
  mode: number,
  status: string,
) => {
  const product = await createStripeProduct(stripeAccountId)
  const price = await createStripePrice(stripeAccountId, product.stripeId)
  const customer = await createStripeCustomer(stripeAccountId)
  const subscription = await createStripeSubscription(
    stripeAccountId,
    customer.stripeId,
    price.stripeId,
    {},
  )
  const invoice = await createStripeInvoice(
    stripeAccountId,
    subscription.stripeId,
    {},
    genStripeId('inv'),
  )
  return await createStripeCharge(
    stripeAccountId,
    {},
    status,
    amount,
    stripeCreatedDate,
    invoice.stripeId,
    mode,
  )
}
