/**
 * @jest-environment node
 */

import app from '@/index'
import { TestClient } from '@/lib/test/client'
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
  TelemetryService.prototype.identify = vi.fn()
  TelemetryService.prototype.groupIdentify = vi.fn()
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
    const res = await client.request('/stripe/identify', {
      method: 'POST',
      body: JSON.stringify({}),
    })

    expect(res.status).toBe(403)
    expect(await res.json()).toEqual({
      error: 'Unauthorized',
    })
  })

  test('Sends an identify event to PostHog', async () => {
    const account = await client.createTestStripeAccount()
    const user = await client.createTestStripeUser(account.stripeId)
    const res = await client.stripeRequest(
      '/stripe/identify',
      {
        method: 'POST',
        body: JSON.stringify({
          account_id: account.stripeId,
          user_id: user.stripeId,
          user_email: user.email,
          user_name: user.name,
        }),
      },
      {
        POSTHOG_API_HOST: 'http://localhost:3000',
        POSTHOG_API_KEY: 'phk_123',
      },
    )

    expect(res.status).toBe(200)
    expect(telemetryService.identify).toBeCalledTimes(1)
    expect(telemetryService.identify).toBeCalledWith(
      user.id.toString(),
      {
        email: user.email,
        name: user.name,
        stripe_id: user.stripeId,
      },
      undefined,
    )
    expect(telemetryService.groupIdentify).toBeCalledTimes(1)
    expect(telemetryService.groupIdentify).toBeCalledWith(
      user.id.toString(),
      account.stripeId,
      undefined,
    )
  })
})
