import { Redis } from 'https://deno.land/x/upstash_redis/mod.ts'
import { verify } from 'https://deno.land/x/djwt@v2.7/mod.ts'

// Deno.env.set(
//   'SUPABASE_JWT_SECRET',
//   'super-secret-jwt-token-with-at-least-32-characters-long',
// )

const SIGNING_KEY = Deno.env.get('SUPABASE_JWT_SECRET')

const KEY = await crypto.subtle.importKey(
  'raw',
  new TextEncoder().encode(SIGNING_KEY),
  {
    name: 'HMAC',
    hash: 'SHA-256',
  },
  true,
  ['verify'],
)

const fetchState = async (id: string, origin: string, headers: any) => {
  const response = await fetch(`${origin}/api/customers/${id}/state`, {
    headers,
  })
  return await response.json()
}

const requestToken = async (headers: Headers) => {
  if (!SIGNING_KEY) {
    throw new Error('Signing key not set')
  }

  const authorization = headers.get('authorization') || 'Bearer '
  const token = authorization.split(' ')[1]
  const payload = await verify(token, KEY)

  if (!payload.sub) {
    throw new Error('Invalid jwt')
  }

  return {
    sub: payload.sub as string,
  }
}

const handler = async (request: Request) => {
  console.time('request')
  const parsed = new URL(request.url)
  const pathParts = parsed.pathname.split('/')
  const id = pathParts[pathParts.length - 2]
  const { sub: accountId } = await requestToken(request.headers)

  if (!accountId) {
    return new Response(JSON.stringify({ error: 'Invalid account id' }), {
      status: 403,
    })
  }

  try {
    const redis = Redis.fromEnv()
    const key = `${accountId}:customer_state:${id}`
    console.time('redis')
    let data = await redis.get(key)
    console.timeEnd('redis')
    if (!data) {
      console.log('Cache miss')
      data = await fetchState(id, parsed.origin, request.headers)
      await redis.set(key, JSON.stringify(data))
    } else {
      console.log('Cache hit')
    }
    const response = JSON.stringify(data)
    console.timeEnd('request')
    return new Response(response)
  } catch (error) {
    console.error(error)
    const data = await fetchState(id, parsed.origin, request.headers)
    const response = JSON.stringify(data)
    console.timeEnd('request')
    return new Response(response)
  }
}

export default handler
