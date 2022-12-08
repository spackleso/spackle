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
  console.log('check 1')
  console.time('request')
  const parsed = new URL(request.url)
  const pathParts = parsed.pathname.split('/')
  const id = pathParts[pathParts.length - 2]
  console.log('check 2')
  const { sub: accountId } = await requestToken(request.headers)
  console.log('check 3')

  if (!accountId) {
    return new Response(JSON.stringify({ error: 'Invalid account id' }), {
      status: 403,
    })
  }

  try {
    console.log('check 4')
    const redis = Redis.fromEnv()
    const key = `${accountId}:customer_state:${id}`
    console.log('check 5')
    console.time('redis')
    let data = await redis.get(key)
    console.timeEnd('redis')
    console.log('check 6')
    if (!data) {
      console.log('check 7')
      console.log('Cache miss')
      data = await fetchState(id, parsed.origin, request.headers)
      console.log('check 8')
      await redis.set(key, JSON.stringify(data))
      console.log('check 9')
    } else {
      console.log('check 10')
      console.log('Cache hit')
    }
    console.log('check 11')
    const response = JSON.stringify(data)
    console.timeEnd('request')
    console.log('check 12')
    return new Response(response)
  } catch (error) {
    console.log('check 13')
    console.error(error)
    console.log('check 14')
    const data = await fetchState(id, parsed.origin, request.headers)
    const response = JSON.stringify(data)
    console.timeEnd('request')
    console.log('check 15')
    console.error(error)
    return new Response(response)
  }
}

export default handler
