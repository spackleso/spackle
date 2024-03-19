/**
 * @jest-environment node
 */

import app from '@/index'
import { MOCK_ENV, TestClient } from '@/lib/test/client'
import { beforeAll, afterAll, describe, test, expect, vi } from 'vitest'
import { Queue } from 'bullmq'

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
    const send = vi.fn()
    const res = await client.stripeRequest(
      '/stripe/sync_account',
      {
        method: 'POST',
        body: JSON.stringify({
          account_id: 'acct_123',
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
    expect(send).toHaveBeenCalledWith({
      type: 'syncAllAccountData',
      payload: {
        stripeAccountId: 'acct_123',
      },
    })
  })
})
