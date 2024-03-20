/**
 * @jest-environment node
 */

import app from '@/index'
import { MOCK_ENV, TestClient } from '@/lib/test/client'
import { schema } from '@spackle/db'
import { beforeAll, afterAll, describe, test, expect } from 'vitest'

let client: TestClient
beforeAll(async () => {
  client = new TestClient(app)
})
afterAll(async () => {
  await client.teardown()
})

test('Invalid methods return a 405 error', async () => {
  const { token } = await client.createTestAccountWithToken()
  const res = await app.request(
    '/pricing_tables/123',
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token.token}`,
      },
    },
    MOCK_ENV,
  )

  expect(res.status).toBe(405)
})

test('Returns a 404 if the pricing table does not exist', async () => {
  const { token } = await client.createTestAccountWithToken()
  const res = await app.request(
    '/pricing_tables/123',
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token.token}`,
      },
    },
    MOCK_ENV,
  )

  expect(res.status).toBe(404)
})

test('Returns a pricing table state', async () => {
  const { token, account } = await client.createTestAccountWithToken()
  const pricingTable = await client.createTestPricingTable(
    account.stripeId,
    'Default',
    0,
    true,
    true,
  )
  const basicFeature = await client.createTestFlagFeature(
    account.stripeId,
    'Basic Feature',
    'basic',
    false,
  )
  const proFeature = await client.createTestFlagFeature(
    account.stripeId,
    'Pro Feature',
    'pro',
    false,
  )
  const enterpriseFeature = await client.createTestFlagFeature(
    account.stripeId,
    'Enterprise Feature',
    'enterprise',
    false,
  )
  const basicProduct = await client.createTestStripeProduct(account.stripeId, {
    name: 'Basic',
  })
  const basicMonthly = await client.createTestStripePrice(
    account.stripeId,
    basicProduct.stripeId,
    {
      unit_amount: 1000,
      currency: 'usd',
    },
  )
  const basicAnnual = await client.createTestStripePrice(
    account.stripeId,
    basicProduct.stripeId,
    {
      unit_amount: 10000,
      currency: 'usd',
    },
  )
  const proProduct = await client.createTestStripeProduct(account.stripeId, {
    name: 'Pro',
  })
  const proMonthly = await client.createTestStripePrice(
    account.stripeId,
    proProduct.stripeId,
    {
      unit_amount: 2000,
      currency: 'usd',
    },
  )
  const proAnnual = await client.createTestStripePrice(
    account.stripeId,
    proProduct.stripeId,
    {
      unit_amount: 20000,
      currency: 'usd',
    },
  )
  const enterpriseProduct = await client.createTestStripeProduct(
    account.stripeId,
    {
      name: 'Enterprise',
    },
  )
  const enterpriseMonthly = await client.createTestStripePrice(
    account.stripeId,
    enterpriseProduct.stripeId,
    {
      unit_amount: 3000,
      currency: 'usd',
    },
  )
  const enterpriseAnnual = await client.createTestStripePrice(
    account.stripeId,
    enterpriseProduct.stripeId,
    {
      unit_amount: 30000,
      currency: 'usd',
    },
  )
  await client.createTestProductFeature(account.stripeId, true, {
    product: basicProduct,
    feature: basicFeature,
  })
  await client.createTestProductFeature(account.stripeId, true, {
    product: proProduct,
    feature: basicFeature,
  })
  await client.createTestProductFeature(account.stripeId, true, {
    product: enterpriseProduct,
    feature: basicFeature,
  })
  await client.createTestProductFeature(account.stripeId, true, {
    product: proProduct,
    feature: proFeature,
  })
  await client.createTestProductFeature(account.stripeId, true, {
    product: enterpriseProduct,
    feature: proFeature,
  })
  await client.createTestProductFeature(account.stripeId, true, {
    product: enterpriseProduct,
    feature: enterpriseFeature,
  })
  await client.db.insert(schema.pricingTableProducts).values({
    stripeAccountId: account.stripeId,
    pricingTableId: pricingTable.id,
    stripeProductId: basicProduct.stripeId,
    monthlyStripePriceId: basicMonthly.stripeId,
    annualStripePriceId: basicAnnual.stripeId,
  })
  await client.db.insert(schema.pricingTableProducts).values({
    stripeAccountId: account.stripeId,
    pricingTableId: pricingTable.id,
    stripeProductId: proProduct.stripeId,
    monthlyStripePriceId: proMonthly.stripeId,
    annualStripePriceId: proAnnual.stripeId,
  })
  await client.db.insert(schema.pricingTableProducts).values({
    stripeAccountId: account.stripeId,
    pricingTableId: pricingTable.id,
    stripeProductId: enterpriseProduct.stripeId,
    monthlyStripePriceId: enterpriseMonthly.stripeId,
    annualStripePriceId: enterpriseAnnual.stripeId,
  })
  await client.db.update(schema.pricingTables).set({
    monthlyEnabled: true,
  })
  const res = await app.request(
    `/pricing_tables/${pricingTable.encodedId}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token.token}`,
      },
    },
    MOCK_ENV,
  )
  expect(res.status).toBe(200)
  const data = await res.json()
  const { id, ...table } = data as any
  const returnedTable = {
    ...table,
    products: table.products.map((product: any) => {
      const { id, ...returnedProduct } = product
      return {
        ...returnedProduct,
        features: returnedProduct.features.map((feature: any) => {
          const { id, ...returnedFeature } = feature
          return returnedFeature
        }),
      }
    }),
  }
  expect(returnedTable).toStrictEqual({
    name: 'Default',
    intervals: ['month', 'year'],
    products: [
      {
        name: 'Basic',
        prices: {
          month: {
            id: basicMonthly.stripeId,
            unit_amount: 1000,
            currency: 'usd',
          },
          year: {
            id: basicAnnual.stripeId,
            unit_amount: 10000,
            currency: 'usd',
          },
        },
        features: [
          {
            name: 'Basic Feature',
            key: 'basic',
            type: 0,
            value_flag: true,
            value_limit: null,
          },
          {
            name: 'Enterprise Feature',
            key: 'enterprise',
            type: 0,
            value_flag: false,
            value_limit: null,
          },
          {
            name: 'Pro Feature',
            key: 'pro',
            type: 0,
            value_flag: false,
            value_limit: null,
          },
        ],
      },
      {
        name: 'Pro',
        prices: {
          month: {
            id: proMonthly.stripeId,
            unit_amount: 2000,
            currency: 'usd',
          },
          year: {
            id: proAnnual.stripeId,
            unit_amount: 20000,
            currency: 'usd',
          },
        },
        features: [
          {
            name: 'Basic Feature',
            key: 'basic',
            type: 0,
            value_flag: true,
            value_limit: null,
          },
          {
            name: 'Enterprise Feature',
            key: 'enterprise',
            type: 0,
            value_flag: false,
            value_limit: null,
          },
          {
            name: 'Pro Feature',
            key: 'pro',
            type: 0,
            value_flag: true,
            value_limit: null,
          },
        ],
      },
      {
        name: 'Enterprise',
        prices: {
          month: {
            id: enterpriseMonthly.stripeId,
            unit_amount: 3000,
            currency: 'usd',
          },
          year: {
            id: enterpriseAnnual.stripeId,
            unit_amount: 30000,
            currency: 'usd',
          },
        },
        features: [
          {
            name: 'Basic Feature',
            key: 'basic',
            type: 0,
            value_flag: true,
            value_limit: null,
          },
          {
            name: 'Enterprise Feature',
            key: 'enterprise',
            type: 0,
            value_flag: true,
            value_limit: null,
          },
          {
            name: 'Pro Feature',
            key: 'pro',
            type: 0,
            value_flag: true,
            value_limit: null,
          },
        ],
      },
    ],
  })
})

test('GET is allowed with a publishable token', async () => {
  const { token, account } =
    await client.createTestAccountWithPublishableToken()
  const pricingTable = await client.createTestPricingTable(
    account.stripeId,
    'Default',
    0,
    true,
    true,
  )
  const res = await app.request(
    `/pricing_tables/${pricingTable.encodedId}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token.token}`,
      },
    },
    MOCK_ENV,
  )

  expect(res.status).toBe(200)

  const data = await res.json()
  const { id, ...table } = data as any
  expect(table).toStrictEqual({
    name: 'Default',
    intervals: ['month', 'year'],
    products: [],
  })
})
