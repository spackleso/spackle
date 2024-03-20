/**
 * @jest-environment node
 */

import app from '@/index'
import { MOCK_ENV, TestClient } from '@/lib/test/client'
import { schema, eq } from '@spackle/db'
import { beforeAll, afterAll, describe, test, expect } from 'vitest'

let client: TestClient
beforeAll(async () => {
  client = new TestClient(app)
})
afterAll(async () => {
  await client.teardown()
})

describe('POST', () => {
  test('Requires a signature', async () => {
    const res = await app.request(
      '/stripe/update_customer_features',
      {
        method: 'POST',
        body: JSON.stringify({}),
      },
      MOCK_ENV,
    )

    expect(res.status).toBe(403)
    expect(await res.json()).toEqual({
      error: 'Unauthorized',
    })
  })

  test('Creates, updates, and deletes product features based on client state', async () => {
    const account = await client.createTestStripeAccount()
    const customer = await client.createTestStripeCustomer(account.stripeId)
    const createdFeature = await client.createTestFlagFeature(
      account.stripeId,
      'Created',
      'created',
      false,
    )
    const updatedCustomerFlagFeature =
      await client.createTestCustomerFlagFeature(
        account.stripeId,
        'Updated Flag',
        'updated_flag',
        false,
        customer,
      )
    const updatedCustomerLimitFeature =
      await client.createTestCustomerLimitFeature(
        account.stripeId,
        'Updated Limit',
        'updated_limit',
        10,
        customer,
      )
    await client.createTestCustomerFlagFeature(
      account.stripeId,
      'Delete',
      'delete',
      false,
      customer,
    )

    const res = await client.stripeRequest('/stripe/update_customer_features', {
      method: 'POST',
      body: JSON.stringify({
        account_id: account.stripeId,
        customer_id: customer.stripeId,
        customer_features: [
          {
            feature_id: createdFeature.id,
            value_limit: null,
            value_flag: true,
          },
          {
            id: updatedCustomerFlagFeature.id,
            feature_id: updatedCustomerFlagFeature.featureId,
            value_limit: null,
            value_flag: true,
          },
          {
            id: updatedCustomerLimitFeature.id,
            feature_id: updatedCustomerLimitFeature.featureId,
            value_limit: 100,
            value_flag: null,
          },
        ],
      }),
    })

    expect(res.status).toBe(200)

    const pfs = await client.db
      .select()
      .from(schema.customerFeatures)
      .where(eq(schema.customerFeatures.stripeAccountId, account.stripeId))
      .orderBy(schema.customerFeatures.id)

    expect(pfs.length).toBe(3)

    expect(pfs[0]).toEqual({
      createdAt: updatedCustomerFlagFeature.createdAt,
      featureId: updatedCustomerFlagFeature.featureId,
      id: updatedCustomerFlagFeature.id,
      stripeAccountId: account.stripeId,
      stripeCustomerId: customer.stripeId,
      valueFlag: true,
      valueLimit: null,
    })

    expect(pfs[1]).toEqual({
      createdAt: updatedCustomerLimitFeature.createdAt,
      featureId: updatedCustomerLimitFeature.featureId,
      id: updatedCustomerLimitFeature.id,
      stripeAccountId: account.stripeId,
      stripeCustomerId: customer.stripeId,
      valueFlag: null,
      valueLimit: 100,
    })

    expect(pfs[2].featureId).toBe(createdFeature.id)
    expect(pfs[2].stripeAccountId).toBe(account.stripeId)
    expect(pfs[2].stripeCustomerId).toBe(customer.stripeId)
    expect(pfs[2].valueFlag).toBe(true)
    expect(pfs[2].valueLimit).toBe(null)
  })
})
