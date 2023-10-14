const host = process.env.POSTHOG_HOST ?? 'https://app.posthog.com'
const key = process.env.POSTHOG_API_KEY ?? ''

export const identify = (
  userId: string,
  properties: any,
  path: string = '/',
) => {
  return fetch(`${host}/capture`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      api_key: key,
      distinct_id: userId,
      event: '$identify',
      $set: properties,
      $set_once: {
        $initial_current_url: `https://stripe.spackle.so${path}`,
      },
    }),
  })
}

export const groupIdentify = (
  userId: string,
  groupId: string,
  name: string,
) => {
  return fetch(`${host}/capture`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      api_key: key,
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

export const track = (distinctId: string, event: string, properties: any) => {
  return fetch(`${host}/capture`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      api_key: key,
      distinct_id: distinctId,
      event,
      properties,
    }),
  })
}
