import type { Context } from 'https://edge.netlify.com'
import { Redis } from 'https://deno.land/x/upstash_redis/mod.ts'

const handler = async (request: Request, context: Context) => {
  const parsed = new URL(request.url)
  const pathParts = parsed.pathname.split('/')
  const id = pathParts[pathParts.length - 2]

  try {
    const redis = Redis.fromEnv()
    return new Response(JSON.stringify({ redis: 'conntected' }))
  } catch (error) {
    const response = await fetch(`${parsed.origin}/api/customers/${id}/state`, {
      headers: request.headers,
    })
    const data = await response.json()
    return new Response(JSON.stringify(data))
  }
}

export default handler
