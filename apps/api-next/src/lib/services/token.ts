import { Database, eq, schema } from '@spackle/db'
import jwt from '@tsndr/cloudflare-worker-jwt'

export class TokenService {
  private readonly db: Database
  private readonly secret: string

  constructor(db: Database, secret: string) {
    this.db = db
    this.secret = secret
  }

  getToken = async (stripeAccountId: string) => {
    const result = await this.db
      .select()
      .from(schema.tokens)
      .where(eq(schema.tokens.stripeAccountId, stripeAccountId))

    return result.length ? result[0] : null
  }

  getPublishableToken = async (stripeAccountId: string) => {
    const result = await this.db
      .select()
      .from(schema.publishableTokens)
      .where(eq(schema.publishableTokens.stripeAccountId, stripeAccountId))

    return result.length ? result[0] : null
  }

  createToken = async (stripeAccountId: string) => {
    const token = await jwt.sign(
      {
        sub: stripeAccountId,
        iat: Math.floor(Date.now() / 1000),
      },
      this.secret,
    )

    const result = await this.db
      .insert(schema.tokens)
      .values({
        stripeAccountId,
        token,
      })
      .returning()

    return result[0]
  }

  createPublishableToken = async (stripeAccountId: string) => {
    console.log('createPublishableToken', stripeAccountId, this.secret)
    const token = await jwt.sign(
      {
        sub: stripeAccountId,
        iat: Math.floor(Date.now() / 1000),
        publishable: true,
      },
      this.secret,
    )

    const result = await this.db
      .insert(schema.publishableTokens)
      .values({
        stripeAccountId,
        token,
      })
      .returning()

    return result[0]
  }
}
