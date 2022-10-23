import type { Context } from 'https://edge.netlify.com'
import { Redis } from 'https://deno.land/x/upstash_redis/mod.ts'

const fetchState = async (id: string, origin: string, headers: any) => {
  const response = await fetch(`${origin}/api/customers/${id}/state`, {
    headers,
  })
  return await response.json()
}

const handler = async (request: Request, context: Context) => {
  const parsed = new URL(request.url)
  const pathParts = parsed.pathname.split('/')
  const id = pathParts[pathParts.length - 2]
  const accountId = request.headers.get('spackle-account-id')

  if (!accountId) {
    return new Response(JSON.stringify({ error: 'Invalid account id' }), {
      status: 403,
    })
  }

  try {
    const redis = Redis.fromEnv()
    const key = `customer_state_${accountId}_${id}`
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
    return new Response(JSON.stringify(data))
  } catch (error) {
    console.error(error)
    const data = await fetchState(id, parsed.origin, request.headers)
    return new Response(JSON.stringify(data))
  }
}

export default handler
