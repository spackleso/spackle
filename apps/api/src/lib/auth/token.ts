import jwt, { JwtPayload } from '@tsndr/cloudflare-worker-jwt'
import { Database, eq, schema } from '@spackle/db'

type TokenPayload = JwtPayload & {
  publishable: boolean
}

export async function verifyToken(
  token: string,
  secret: string,
): Promise<TokenPayload> {
  let payload
  try {
    const data = jwt.decode(token)
    payload = data.payload
  } catch (error) {}

  if (!payload || !(await jwt.verify(token, secret))) {
    throw new Error('Unauthorized')
  }

  return payload as TokenPayload
}

export async function authorizeToken(
  token: string,
  secret: string,
  db: Database,
) {
  const payload = await verifyToken(token, secret)
  const sub = payload.sub as string
  const publishable = !!(payload as TokenPayload).publishable

  if (publishable) {
    const response = await db
      .select()
      .from(schema.publishableTokens)
      .where(eq(schema.publishableTokens.token, token))

    if (!response.length) {
      throw new Error('Unauthorized')
    }
  } else {
    const response = await db
      .select()
      .from(schema.tokens)
      .where(eq(schema.tokens.token, token))

    if (!response.length) {
      throw new Error('Unauthorized')
    }
  }

  return { sub, publishable }
}
