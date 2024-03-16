import crypto from 'crypto'
import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import { Database, schema } from '@spackle/db'
import stripe from 'stripe'
import { OpenAPIHono } from '@hono/zod-openapi'
import { HonoEnv } from '@/lib/hono/env'
import { DatabaseService } from '../db/service'
import { TelemetryService } from '../telemetry/service'
import { Toucan } from 'toucan-js'

export const genStripeId = (prefix: string) => {
  return `${prefix}_${crypto.randomBytes(16).toString('hex')}`
}

export const MOCK_ENV = {
  DATABASE_URL: 'postgresql://postgres:postgres@localhost:54322/postgres',
  DB_PK_SALT: 'salt',
  ENVIRONMENT: 'test',
  ORIGIN: 'http://localhost:3000',
  POSTHOG_API_HOST: 'http://localhost:3000',
  POSTHOG_API_KEY: 'phk_123',
  STRIPE_LIVE_SECRET_KEY: 'live_123',
  STRIPE_SIGNING_SECRET: 'absec_123',
  STRIPE_TEST_SECRET_KEY: 'test_123',
}

export class TestClient {
  app: OpenAPIHono<HonoEnv>
  client: postgres.Sql
  db: Database
  dbService: DatabaseService
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
  }

  async teardown() {
    await this.client.end()
  }

  stripeRequest(url: string, options: RequestInit) {
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
    return this.app.request(url, options, this.env)
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
}
