import { Toucan } from 'toucan-js'

export class TelemetryService {
  private readonly posthogHost: string = 'https://app.posthog.com'
  private readonly posthogKey: string
  private readonly sentry: Toucan
  private readonly enabled: boolean = true

  constructor(posthogHost: string, posthogKey: string, sentry: Toucan) {
    this.posthogHost = posthogHost
    this.posthogKey = posthogKey
    this.sentry = sentry
    this.enabled = !!posthogHost && !!posthogKey
  }

  async identify(userId: string, properties: any, path: string = '/') {
    if (!this.enabled) {
      console.log(`Telemetry is disabled. Would have identified user ${userId}`)
      return
    }

    const response = await fetch(`${this.posthogHost}/capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: this.posthogKey,
        distinct_id: userId,
        event: '$identify',
        $set: properties,
        $set_once: {
          $initial_current_url: `https://stripe.spackle.so${path}`,
        },
      }),
    })

    if (!response.ok) {
      this.sentry.captureMessage(`Failed to identify user ${userId} in PostHog`)
    }
  }

  async groupIdentify(userId: string, groupId: string, name: string) {
    if (!this.enabled) {
      console.log(
        `Telemetry is disabled. Would have group identified user ${userId} in group ${groupId}`,
      )
      return
    }

    const response = await fetch(`${this.posthogHost}/capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: this.posthogKey,
        event: '$groupidentify',
        properties: {
          distinct_id: userId,
          $group_type: 'company',
          $group_key: groupId,
          $group_set: {
            name,
          },
        },
      }),
    })

    if (!response.ok) {
      this.sentry.captureMessage(
        `Failed to group identify user ${userId} in group ${groupId} in PostHog`,
      )
    }
  }

  async track(distinctId: string, event: string, properties: any) {
    if (!this.enabled) {
      console.log(
        `Telemetry is disabled. Would have tracked event ${event} for user ${distinctId}`,
      )
      return
    }

    const response = await fetch(`${this.posthogHost}/capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: this.posthogKey,
        distinct_id: distinctId,
        event,
        properties,
      }),
    })

    if (!response.ok) {
      this.sentry.captureMessage(
        `Failed to track event ${event} for user ${distinctId} in PostHog`,
      )
    }
  }
}
