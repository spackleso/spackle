import crypto from 'crypto'
import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import { Database, schema } from '@spackle/db'
import stripe from 'stripe'
import { OpenAPIHono } from '@hono/zod-openapi'
import { HonoEnv } from '@/lib/hono/env'
import { DatabaseService } from '@/lib/services/db'
import { TelemetryService } from '@/lib/services/telemetry'
import { Toucan } from 'toucan-js'
import { TokenService } from '../services/token'

export const genStripeId = (prefix: string) => {
  return `${prefix}_${crypto.randomBytes(16).toString('hex')}`
}

export const MOCK_ENV = {
  BILLING_STRIPE_ACCOUNT_ID: 'acct_123',
  BILLING_ENTITLEMENTS_PRICE_ID: 'price_123',
  DATABASE_URL: 'postgresql://postgres:postgres@localhost:54322/postgres',
  DB_PK_SALT: 'salt',
  ENVIRONMENT: 'test',
  ORIGIN: 'http://localhost:3000',
  STRIPE_LIVE_SECRET_KEY: 'live_123',
  STRIPE_SIGNING_SECRET: 'absec_123',
  STRIPE_TEST_SECRET_KEY: 'test_123',
  SUPABASE_JWT_SECRET:
    'super-secret-jwt-token-with-at-least-32-characters-long',
}

export class TestClient {
  app: OpenAPIHono<HonoEnv>
  client: postgres.Sql
  db: Database
  dbService: DatabaseService
  tokenService: TokenService
  env: Record<string, string> = MOCK_ENV

  constructor(app: OpenAPIHono<HonoEnv>, env: Record<string, string> = {}) {
    this.app = app
    this.env = {
      ...this.env,
      ...env,
    }
    this.client = postgres(this.env.DATABASE_URL)
    this.db = drizzle(this.client, { schema })
    this.dbService = new DatabaseService(
      this.db,
      new TelemetryService(
        this.env.POSTHOG_API_HOST,
        this.env.POSTHOG_API_KEY,
        new Toucan({ enabled: false }),
      ),
      this.env.DB_PK_SALT,
    )
    this.tokenService = new TokenService(this.db, this.env.SUPABASE_JWT_SECRET)
  }

  async teardown() {
    await this.client.end()
  }

  stripeRequest(
    url: string,
    options: RequestInit,
    env?: Record<string, string>,
  ) {
    options = {
      ...options,
      headers: {
        ...options.headers,
        'Stripe-Signature': stripe.webhooks.generateTestHeaderString({
          payload: options.body as string,
          secret: this.env.STRIPE_SIGNING_SECRET,
        }),
      },
    }

    env = {
      ...this.env,
      ...env,
    }

    return this.app.request(url, options, env)
  }

  async createTestStripeAccount() {
    const stripeId = genStripeId('acct')
    const result = await this.db
      .insert(schema.stripeAccounts)
      .values({
        stripeId,
        billingStripeCustomerId: genStripeId('cus'),
      })
      .returning()
    return result[0]
  }

  async createTestAccountWithToken() {
    const account = await this.createTestStripeAccount()
    const token = await this.tokenService.createToken(account.stripeId)

    return {
      account,
      token,
    }
  }

  async createTestAccountWithPublishableToken() {
    const account = await this.createTestStripeAccount()
    const token = await this.tokenService.createPublishableToken(
      account.stripeId,
    )

    return {
      account,
      token,
    }
  }

  createTestFlagFeature = async (
    stripeAccountId: string,
    name: string,
    key: string,
    valueFlag: boolean,
  ) => {
    const result = await this.db
      .insert(schema.features)
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

  createTestPricingTable = async (
    stripeAccountId: string,
    name: string,
    mode: number,
    monthlyEnabled: boolean,
    annualEnabled: boolean,
  ) => {
    const result = await this.db
      .insert(schema.pricingTables)
      .values({
        stripeAccountId,
        name,
        mode,
        annualEnabled,
        monthlyEnabled,
      })
      .returning({
        id: schema.pricingTables.id,
        encodedId: this.dbService.encodePk(schema.pricingTables.id),
        name: schema.pricingTables.name,
        mode: schema.pricingTables.mode,
        monthlyEnabled: schema.pricingTables.monthlyEnabled,
        annualEnabled: schema.pricingTables.annualEnabled,
      })
    return result[0]
  }

  async createTestStripeProduct(stripeAccountId: string, stripeJson?: any) {
    const stripeId = genStripeId('prod')
    const result = await this.db
      .insert(schema.stripeProducts)
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

  async createTestStripePrice(
    stripeAccountId: string,
    stripeProductId: string,
    stripeJson?: any,
  ) {
    const stripeId = genStripeId('price')
    const result = await this.db
      .insert(schema.stripePrices)
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

  async createTestStripeCustomer(stripeAccountId: string) {
    const stripeId = genStripeId('cust')
    const result = await this.db
      .insert(schema.stripeCustomers)
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

  async createTestCustomerFlagFeature(
    stripeAccountId: string,
    name: string,
    key: string,
    valueFlag: boolean,
    customer?: any,
  ) {
    const feature = await this.createTestFlagFeature(
      stripeAccountId,
      name,
      key,
      false,
    )

    if (!customer) {
      customer = await this.createTestStripeCustomer(stripeAccountId)
    }

    const result = await this.db
      .insert(schema.customerFeatures)
      .values({
        stripeAccountId,
        featureId: feature.id,
        stripeCustomerId: customer.stripeId,
        valueFlag,
      })
      .returning()
    return result[0]
  }

  async createTestPricingTableProduct(
    stripeAccountId: string,
    pricingTableId: number,
    stripeProductId: string,
    monthlyStripePriceId?: string | null,
    annualStripePriceId?: string | null,
  ) {
    const result = await this.db
      .insert(schema.pricingTableProducts)
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

  async createTestProductFeature(
    stripeAccountId: string,
    valueFlag: boolean,
    opts: any,
  ) {
    if (!opts.feature) {
      opts.feature = await this.createTestFlagFeature(
        stripeAccountId,
        opts.name,
        opts.key,
        false,
      )
    }

    if (!opts.product) {
      opts.product = await this.createTestStripeProduct(stripeAccountId)
    }

    const result = await this.db
      .insert(schema.productFeatures)
      .values({
        stripeAccountId,
        featureId: opts.feature.id,
        stripeProductId: opts.product.stripeId,
        valueFlag,
      })
      .returning()
    return result[0]
  }

  async createTestStripeUser(stripeAccountId: string) {
    const stripeId = genStripeId('usr')
    const result = await this.db
      .insert(schema.stripeUsers)
      .values({
        stripeId,
        stripeAccountId,
      })
      .returning()
    return result[0]
  }

  async createTestLimitFeature(
    stripeAccountId: string,
    name: string,
    key: string,
    valueLimit: number,
  ) {
    const result = await this.db
      .insert(schema.features)
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

  async createTestCustomerLimitFeature(
    stripeAccountId: string,
    name: string,
    key: string,
    valueLimit: number,
    customer?: any,
  ) {
    const feature = await this.createTestLimitFeature(
      stripeAccountId,
      name,
      key,
      valueLimit,
    )

    if (!customer) {
      customer = await this.createTestStripeCustomer(stripeAccountId)
    }

    const result = await this.db
      .insert(schema.customerFeatures)
      .values({
        stripeAccountId,
        featureId: feature.id,
        stripeCustomerId: customer.stripeId,
        valueLimit,
      })
      .returning()
    return result[0]
  }

  async createTestStripeSubscription(
    stripeAccountId: string,
    stripeCustomerId: string,
    stripePriceId: string,
    stripeJson: any,
    stripeId: string = genStripeId('sub'),
    siId: string = genStripeId('si'),
    status: string = 'active',
  ) {
    stripeJson = {
      id: stripeId,
      ...stripeJson,
    }

    const subs = await this.db
      .insert(schema.stripeSubscriptions)
      .values({
        status,
        stripeAccountId,
        stripeCustomerId,
        stripeId,
        stripeJson,
      })
      .returning()

    await this.db
      .insert(schema.stripeSubscriptionItems)
      .values({
        stripeAccountId,
        stripeId: siId,
        stripePriceId,
        stripeSubscriptionId: subs[0].stripeId,
      })
      .returning()

    return subs[0]
  }

  createTestBillableCharge = async (
    stripeAccountId: string,
    amount: number,
    stripeCreatedDate: Date,
    mode: number,
    status: string,
  ) => {
    const product = await this.createTestStripeProduct(stripeAccountId)
    const price = await this.createTestStripePrice(
      stripeAccountId,
      product.stripeId,
    )
    const customer = await this.createTestStripeCustomer(stripeAccountId)

    const subscription = await this.createTestStripeSubscription(
      stripeAccountId,
      customer.stripeId,
      price.stripeId,
      {},
    )
    const invoice = await this.createTestStripeInvoice(
      stripeAccountId,
      subscription.stripeId,
      {},
      genStripeId('inv'),
    )
    return await this.createTestStripeCharge(
      stripeAccountId,
      {},
      status,
      amount,
      stripeCreatedDate,
      invoice.stripeId,
      mode,
    )
  }

  async createTestStripeInvoice(
    stripeAccountId: string,
    stripeSubscriptionId: string | null,
    stripeJson: any,
    stripeId: string = genStripeId('inv'),
  ) {
    const result = await this.db
      .insert(schema.stripeInvoices)
      .values({
        stripeAccountId,
        stripeId,
        stripeSubscriptionId,
        stripeJson,
      })
      .returning()
    return result[0]
  }

  async createTestStripeCharge(
    stripeAccountId: string,
    stripeJson: any,
    status: string,
    amount: number,
    stripeCreated: Date,
    stripeInvoiceId: string | null,
    mode: number,
    stripeId: string = genStripeId('ch'),
  ) {
    const result = await this.db
      .insert(schema.stripeCharges)
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
}
