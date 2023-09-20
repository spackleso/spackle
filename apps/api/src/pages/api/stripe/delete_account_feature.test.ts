/**
 * @jest-environment node
 */
import handler from '@/pages/api/stripe/delete_account_feature'
import {
  createAccount,
  createFlagFeature,
  stripeTestHandler,
  testHandler,
} from '@/tests/helpers'
import { eq } from 'drizzle-orm'
import db, { features } from '@/db'

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

  test('Deletes a feature', async () => {
    const account = await createAccount()
    const feature = await createFlagFeature(
      account.stripeId,
      'Feature',
      'feature',
      false,
    )
    const res = await stripeTestHandler(handler, {
      method: 'POST',
      body: {
        account_id: account.stripeId,
        feature_id: feature.id,
      },
    })

    expect(res._getStatusCode()).toBe(200)
    const result = await db
      .select()
      .from(features)
      .where(eq(features.id, feature.id))
    expect(result.length).toBe(0)
  })

  test('Does not delete other account features', async () => {
    const decoyAccount = await createAccount()
    const feature = await createFlagFeature(
      decoyAccount.stripeId,
      'Feature',
      'feature',
      false,
    )
    const account = await createAccount()
    const res = await stripeTestHandler(handler, {
      method: 'POST',
      body: {
        account_id: account.stripeId,
        feature_id: feature.id,
      },
    })
    expect(res._getStatusCode()).toBe(200)
    const result = await db
      .select()
      .from(features)
      .where(eq(features.id, feature.id))
    expect(result.length).toBe(1)
  })
})
