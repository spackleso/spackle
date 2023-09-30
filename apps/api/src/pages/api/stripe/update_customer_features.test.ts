/**
 * @jest-environment node
 */
import handler from '@/pages/api/stripe/update_customer_features'
import {
  createAccount,
  createFlagFeature,
  createCustomerFlagFeature,
  createStripeCustomer,
  stripeTestHandler,
  testHandler,
  createCustomerLimitFeature,
} from '@/tests/helpers'
import db, { customerFeatures } from '@/db'
import { eq } from 'drizzle-orm'

jest.mock('@/store/dynamodb', () => {
  return {
    __esModule: true,
    storeCustomerState: jest.fn(() => Promise.resolve()),
  }
})

describe('POST', () => {
  test('Requires a signature', async () => {
    const res = await testHandler(handler, {
      method: 'POST',
      body: {},
    })

    expect(res._getStatusCode()).toBe(403)
    expect(res._getData()).toBe(
      JSON.stringify({
        error: 'Unauthorized',
      }),
    )
  })

  test('Creates, updates, and deletes product features based on client state', async () => {
    const account = await createAccount()
    const customer = await createStripeCustomer(account.stripeId)
    const createdFeature = await createFlagFeature(
      account.stripeId,
      'Created',
      'created',
      false,
    )
    const updatedCustomerFlagFeature = await createCustomerFlagFeature(
      account.stripeId,
      'Updated Flag',
      'updated_flag',
      false,
      customer,
    )
    const updatedCustomerLimitFeature = await createCustomerLimitFeature(
      account.stripeId,
      'Updated Limit',
      'updated_limit',
      10,
      customer,
    )

    await createCustomerFlagFeature(
      account.stripeId,
      'Delete',
      'delete',
      false,
      customer,
    )

    const res = await stripeTestHandler(handler, {
      body: {
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
      },
    })

    expect(res._getStatusCode()).toBe(200)

    const pfs = await db
      .select()
      .from(customerFeatures)
      .where(eq(customerFeatures.stripeAccountId, account.stripeId))
      .orderBy(customerFeatures.id)

    expect(pfs.length).toBe(3)

    expect(pfs[0]).toStrictEqual({
      createdAt: updatedCustomerFlagFeature.createdAt,
      featureId: updatedCustomerFlagFeature.featureId,
      id: updatedCustomerFlagFeature.id,
      stripeAccountId: account.stripeId,
      stripeCustomerId: customer.stripeId,
      valueFlag: true,
      valueLimit: null,
    })

    expect(pfs[1]).toStrictEqual({
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
