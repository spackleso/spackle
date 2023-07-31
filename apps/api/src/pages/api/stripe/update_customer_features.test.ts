/**
 * @jest-environment node
 */
import handler from '@/pages/api/stripe/update_customer_features'
import {
  createAccount,
  createFlagFeature,
  createCustomerFeature,
  createStripeCustomer,
  stripeTestHandler,
  testHandler,
} from '@/tests/helpers'
import db, { customerFeatures } from 'spackle-db'
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
    const updatedCustomerFeature = await createCustomerFeature(
      account.stripeId,
      'Updated',
      'updated',
      false,
      customer,
    )

    await createCustomerFeature(
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
            id: updatedCustomerFeature.id,
            feature_id: updatedCustomerFeature.featureId,
            value_limit: null,
            value_flag: true,
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

    expect(pfs.length).toBe(2)
    expect(pfs[0]).toStrictEqual({
      createdAt: updatedCustomerFeature.createdAt,
      featureId: updatedCustomerFeature.featureId,
      id: updatedCustomerFeature.id,
      stripeAccountId: account.stripeId,
      stripeCustomerId: customer.stripeId,
      valueFlag: true,
      valueLimit: null,
    })

    expect(pfs[1].featureId).toBe(createdFeature.id)
    expect(pfs[1].stripeAccountId).toBe(account.stripeId)
    expect(pfs[1].stripeCustomerId).toBe(customer.stripeId)
    expect(pfs[1].valueFlag).toBe(true)
    expect(pfs[1].valueLimit).toBe(null)
  })
})
