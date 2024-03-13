export class TelemetryService {
  private readonly posthogHost: string
  private readonly posthogKey: string

  constructor(posthogHost: string, posthogKey: string) {
    this.posthogHost = posthogHost
    this.posthogKey = posthogKey
  }

  identify(userId: string, properties: any, path: string = '/') {
    return fetch(`${this.posthogHost}/capture`, {
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
  }

  groupIdentify(userId: string, groupId: string, name: string) {
    return fetch(`${this.posthogHost}/capture`, {
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
  }

  track = (distinctId: string, event: string, properties: any) => {
    return fetch(`${this.posthogHost}/capture`, {
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
  }
}
