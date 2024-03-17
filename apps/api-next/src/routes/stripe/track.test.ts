/**
 * @jest-environment node
 */

import app from '@/index'
import { MOCK_ENV, TestClient } from '@/lib/test/client'
import {
  beforeAll,
  afterAll,
  describe,
  test,
  expect,
  vi,
  beforeEach,
  afterEach,
} from 'vitest'
import { TelemetryService } from '@/lib/services/telemetry'
import { Toucan } from 'toucan-js'

let client: TestClient
beforeAll(async () => {
  client = new TestClient(app)
})
afterAll(async () => {
  await client.teardown()
})

vi.mock('@/lib/services/telemetry', () => {
  const TelemetryService = vi.fn()
  TelemetryService.prototype.track = vi.fn()
  return { TelemetryService }
})

describe('POST', () => {
  let telemetryService: TelemetryService

  beforeEach(() => {
    telemetryService = new TelemetryService(
      'http://localhost:3000',
      'phk_123',
      new Toucan({}),
    )
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  test('Requires a signature', async () => {
    const res = await app.request(
      '/stripe/track',
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

  test('Sends an identify event to PostHog', async () => {
    const account = await client.createTestStripeAccount()
    const user = await client.createTestStripeUser(account.stripeId)
    const res = await client.stripeRequest('/stripe/track', {
      method: 'POST',
      body: JSON.stringify({
        account_id: account.stripeId,
        user_id: user.stripeId,
        user_email: user.email,
        user_name: user.name,
        event: 'test',
        properties: {
          test: 'test',
        },
      }),
    })

    expect(res.status).toBe(200)
    expect(telemetryService.track).toBeCalledTimes(1)
    expect(telemetryService.track).toBeCalledWith(user.id.toString(), 'test', {
      $groups: {
        company: account.stripeId,
      },
      test: 'test',
    })
  })
})
