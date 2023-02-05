import { IncomingHttpHeaders } from 'http'
import * as Sentry from '@sentry/nextjs'
import jwt from 'jsonwebtoken'
import { NextApiRequest, NextApiResponse } from 'next'
import supabase from 'spackle-supabase'

const { SUPABASE_JWT_SECRET } = process.env

type RequestMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export type AuthenticatedNextApiRequest = NextApiRequest & {
  stripeAccountId: string
}

export type AuthenticatedNextApiHandler = {
  (req: AuthenticatedNextApiRequest, res: NextApiResponse): Promise<void>
}

export const getToken = async (account_id: string) => {
  const response = await supabase
    .from('tokens')
    .select('token')
    .eq('stripe_account_id', account_id)

  if (response.error) {
    throw new Error(response.error.message)
  }

  return response
}

export const createToken = async (stripeAccountId: string) => {
  if (!SUPABASE_JWT_SECRET) {
    throw new Error('Signing key not set')
  }

  const response = await supabase
    .from('tokens')
    .insert({
      stripe_account_id: stripeAccountId,
      token: jwt.sign(
        {
          sub: stripeAccountId,
          iat: Math.floor(Date.now() / 1000),
        },
        SUPABASE_JWT_SECRET,
      ),
    })
    .select()

  if (response.error) {
    throw new Error(response.error.message)
  }

  return response
}

export const requestToken = (headers: IncomingHttpHeaders) => {
  if (!SUPABASE_JWT_SECRET) {
    throw new Error('Signing key not set')
  }

  const authorization = headers['authorization'] || 'Bearer '
  const token = authorization.split(' ')[1]
  const payload = jwt.verify(token, SUPABASE_JWT_SECRET)

  if (!payload.sub) {
    throw new Error('Invalid jwt')
  }

  return {
    sub: payload.sub as string,
  }
}

export const withTokenAuth = (handler: AuthenticatedNextApiHandler) => {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    let stripeAccountId: string
    try {
      const payload = requestToken(req.headers)
      stripeAccountId = payload.sub
    } catch (error) {
      Sentry.captureException(error)
      res.status(403).json({ error: 'Unauthorized' })
      return
    }

    const authenticatedReq = req as AuthenticatedNextApiRequest
    authenticatedReq.stripeAccountId = stripeAccountId
    return handler(authenticatedReq, res)
  }
}

export const withAllowedMethods = (
  handler: AuthenticatedNextApiHandler,
  methods: RequestMethod[],
) => {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    if (!methods.length || methods.includes(req.method as RequestMethod)) {
      return handler(req as AuthenticatedNextApiRequest, res)
    }
    return res.status(405).json({ error: 'Method not allowed' })
  }
}

export const getPagination = (req: NextApiRequest, size: number = 10) => {
  const page = parseInt((req.query.page as string) || '1') - 1
  const limit = size ? +size : 10
  const from = page ? page * limit : 0
  const to = page ? from + size : size

  return { from, to }
}

export const middleware = (
  handler: AuthenticatedNextApiHandler,
  methods: RequestMethod[] = [],
) => {
  return withTokenAuth(withAllowedMethods(handler, methods))
}
