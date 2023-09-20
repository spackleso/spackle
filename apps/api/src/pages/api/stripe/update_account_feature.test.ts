/**
 * @jest-environment node
 */
import handler from '@/pages/api/stripe/update_account_feature'
import {
  createAccount,
  createFlagFeature,
  stripeTestHandler,
  testHandler,
} from '@/tests/helpers'
import exp from 'constants'
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

  test('Updates a feature', async () => {
    const account = await createAccount()
    const feature = await createFlagFeature(
      account.stripeId,
      'Test',
      'test',
      false,
    )

    const res = await stripeTestHandler(handler, {
      body: {
        account_id: account.stripeId,
        id: feature.id,
        name: 'Updated',
        value_flag: true,
        value_limit: null,
      },
    })

    expect(res._getStatusCode()).toBe(200)

    const result = await db
      .select()
      .from(features)
      .where(eq(features.id, feature.id))
    const updatedFeature = result[0]

    expect(updatedFeature.name).toBe('Updated')
    expect(updatedFeature.valueFlag).toBe(true)
  })
})
