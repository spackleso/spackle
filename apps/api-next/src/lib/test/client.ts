import crypto from 'crypto'
import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import { Database, schema } from '@spackle/db'
import stripe from 'stripe'
import { Hono } from 'hono'
import { OpenAPIHono } from '@hono/zod-openapi'
import { HonoEnv } from '@/lib/hono/env'

export const genStripeId = (prefix: string) => {
  return `${prefix}_${crypto.randomBytes(16).toString('hex')}`
}

export const MOCK_ENV = {
  ORIGIN: 'http://localhost:3000',
  DATABASE_URL: 'postgresql://postgres:postgres@localhost:54322/postgres',
  STRIPE_SIGNING_SECRET: 'absec_123',
}

export class TestClient {
  app: OpenAPIHono<HonoEnv>
  client: postgres.Sql
  db: Database
  env: Record<string, string> = MOCK_ENV

  constructor(app: OpenAPIHono<HonoEnv>, env: Record<string, string> = {}) {
    this.app = app
    this.env = {
      ...this.env,
      ...env,
    }
    this.client = postgres(this.env.DATABASE_URL)
    this.db = drizzle(this.client, { schema })
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
}
