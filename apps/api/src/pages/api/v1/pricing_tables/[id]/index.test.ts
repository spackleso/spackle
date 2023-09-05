/**
 * @jest-environment node
 */
import handler from '@/pages/api/v1/pricing_tables/[id]'
import {
  createAccountWithToken,
  createFlagFeature,
  createPricingTable,
  createProductFeature,
  createStripePrice,
  createStripeProduct,
  stripeTestHandler,
  testHandler,
} from '@/tests/helpers'
import db, { pricingTableProducts, pricingTables } from 'spackle-db'

test('Requires an API token', async () => {
  const res = await testHandler(handler, {
    method: 'GET',
    body: {},
  })

  expect(res._getStatusCode()).toBe(403)
  expect(res._getData()).toBe(
    JSON.stringify({
      error: 'Unauthorized',
    }),
  )
})

test('Invalid methods return a 405 error', async () => {
  const { token } = await createAccountWithToken()
  const res = await testHandler(handler, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token.token}`,
    },
    body: {},
  })

  expect(res._getStatusCode()).toBe(405)
})

test('Returns a 404 if the pricing table does not exist', async () => {
  const { token } = await createAccountWithToken()
  const res = await testHandler(handler, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token.token}`,
    },
    query: {
      id: '123',
    },
  })

  expect(res._getStatusCode()).toBe(404)
})

test('Returns a pricing table state', async () => {
  const { token, account } = await createAccountWithToken()
  const pricingTable = await createPricingTable(
    account.stripeId,
    'Default',
    0,
    true,
    true,
  )
  const basicFeature = await createFlagFeature(
    account.stripeId,
    'Basic Feature',
    'basic',
    false,
  )
  const proFeature = await createFlagFeature(
    account.stripeId,
    'Pro Feature',
    'pro',
    false,
  )
  const enterpriseFeature = await createFlagFeature(
    account.stripeId,
    'Enterprise Feature',
    'enterprise',
    false,
  )
  const basicProduct = await createStripeProduct(account.stripeId, {
    name: 'Basic',
  })
  const basicMonthly = await createStripePrice(
    account.stripeId,
    basicProduct.stripeId,
    {
      unit_amount: 1000,
      currency: 'usd',
    },
  )
  const basicAnnual = await createStripePrice(
    account.stripeId,
    basicProduct.stripeId,
    {
      unit_amount: 10000,
      currency: 'usd',
    },
  )
  const proProduct = await createStripeProduct(account.stripeId, {
    name: 'Pro',
  })
  const proMonthly = await createStripePrice(
    account.stripeId,
    proProduct.stripeId,
    {
      unit_amount: 2000,
      currency: 'usd',
    },
  )
  const proAnnual = await createStripePrice(
    account.stripeId,
    proProduct.stripeId,
    {
      unit_amount: 20000,
      currency: 'usd',
    },
  )
  const enterpriseProduct = await createStripeProduct(account.stripeId, {
    name: 'Enterprise',
  })
  const enterpriseMonthly = await createStripePrice(
    account.stripeId,
    enterpriseProduct.stripeId,
    {
      unit_amount: 3000,
      currency: 'usd',
    },
  )
  const enterpriseAnnual = await createStripePrice(
    account.stripeId,
    enterpriseProduct.stripeId,
    {
      unit_amount: 30000,
      currency: 'usd',
    },
  )
  await createProductFeature(account.stripeId, true, {
    product: basicProduct,
    feature: basicFeature,
  })
  await createProductFeature(account.stripeId, true, {
    product: proProduct,
    feature: basicFeature,
  })
  await createProductFeature(account.stripeId, true, {
    product: enterpriseProduct,
    feature: basicFeature,
  })
  await createProductFeature(account.stripeId, true, {
    product: proProduct,
    feature: proFeature,
  })
  await createProductFeature(account.stripeId, true, {
    product: enterpriseProduct,
    feature: proFeature,
  })
  await createProductFeature(account.stripeId, true, {
    product: enterpriseProduct,
    feature: enterpriseFeature,
  })
  await db.insert(pricingTableProducts).values({
    stripeAccountId: account.stripeId,
    pricingTableId: pricingTable.id,
    stripeProductId: basicProduct.stripeId,
    monthlyStripePriceId: basicMonthly.stripeId,
    annualStripePriceId: basicAnnual.stripeId,
  })
  await db.insert(pricingTableProducts).values({
    stripeAccountId: account.stripeId,
    pricingTableId: pricingTable.id,
    stripeProductId: proProduct.stripeId,
    monthlyStripePriceId: proMonthly.stripeId,
    annualStripePriceId: proAnnual.stripeId,
  })
  await db.insert(pricingTableProducts).values({
    stripeAccountId: account.stripeId,
    pricingTableId: pricingTable.id,
    stripeProductId: enterpriseProduct.stripeId,
    monthlyStripePriceId: enterpriseMonthly.stripeId,
    annualStripePriceId: enterpriseAnnual.stripeId,
  })
  await db.update(pricingTables).set({
    monthlyEnabled: true,
  })
  const res = await stripeTestHandler(handler, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token.token}`,
    },
    query: {
      id: pricingTable.encodedId,
    },
  })
  expect(res._getStatusCode()).toBe(200)
  const data = res._getJSONData()
  const { id, ...table } = data
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
            unit_amount: 1000,
            currency: 'usd',
          },
          year: {
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
            unit_amount: 2000,
            currency: 'usd',
          },
          year: {
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
            unit_amount: 3000,
            currency: 'usd',
          },
          year: {
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
