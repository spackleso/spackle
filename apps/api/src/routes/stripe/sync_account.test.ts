/**
 * @jest-environment node
 */

import app from '@/index'
import { MOCK_ENV, TestClient } from '@/lib/test/client'
import { beforeAll, afterAll, describe, test, expect, vi } from 'vitest'
import { Queue } from 'bullmq'
import { SYNC_OPS } from '@/lib/services/stripe'

let client: TestClient
beforeAll(async () => {
  client = new TestClient(app)
})
afterAll(async () => {
  await client.teardown()
})

vi.mock('bullmq', () => {
  const Queue = vi.fn()
  Queue.prototype.add = vi.fn()
  return { Queue }
})

describe('POST', () => {
  test('Requires a signature', async () => {
    const res = await app.request(
      '/stripe/sync_account',
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

  test('Syncs all account data', async () => {
    const account = await client.createTestStripeAccount()
    const send = vi.fn()
    const res = await client.stripeRequest(
      '/stripe/sync_account',
      {
        method: 'POST',
        body: JSON.stringify({
          account_id: account.stripeId,
        }),
      },
      {
        ...MOCK_ENV,
        SYNC: {
          send: send,
        },
      },
    )
    expect(res.status).toBe(200)
    for (const mode of ['live', 'test'] as const) {
      for (const op of SYNC_OPS) {
        expect(send).toHaveBeenCalledWith({
          type: op,
          payload: {
            stripeAccountId: account.stripeId,
            mode: mode,
            syncJobId: expect.any(Number),
          },
        })
      }
    }
  })
})
