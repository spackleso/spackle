import { Toucan } from 'toucan-js'

export class TelemetryService {
  private readonly posthogHost: string
  private readonly posthogKey: string
  private readonly sentry: Toucan

  constructor(posthogHost: string, posthogKey: string, sentry: Toucan) {
    this.posthogHost = posthogHost
    this.posthogKey = posthogKey
    this.sentry = sentry
  }

  async identify(userId: string, properties: any, path: string = '/') {
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
