import { NextApiRequest, NextApiResponse } from 'next'
import * as Sentry from '@sentry/nextjs'
import { withLogging } from '@/logger'
import jwt from 'jsonwebtoken'
import { IncomingHttpHeaders } from 'http'
import { getIdentityToken } from '@/cognito'

const { SUPABASE_JWT_SECRET, DYNAMODB_TABLE_NAME, AWS_COGNITO_ROLE_ARN } =
  process.env

interface DynamoDBAdapter {
  name: string
  identity_id: string
  role_arn: string
  table_name: string
  token: string
  aws_region: string
}

interface Data {
  account_id: string
  adapter: DynamoDBAdapter
}

interface Unauthorized {
  error: string
}

const requestToken = (headers: IncomingHttpHeaders) => {
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

const handler = async (
  req: NextApiRequest,
  res: NextApiResponse<Data | Unauthorized>,
) => {
  let accountId: string
  try {
    const payload = requestToken(req.headers)
    accountId = payload.sub
  } catch (error) {
    Sentry.captureException(error)
    return res.status(403).json({ error: 'Unauthorized' })
  }

  const { Token, IdentityId } = await getIdentityToken(accountId)
  if (!Token || !IdentityId || !DYNAMODB_TABLE_NAME || !AWS_COGNITO_ROLE_ARN) {
    return res.status(400).json({ error: 'Configuration error' })
  }

  return res.status(200).json({
    account_id: accountId,
    adapter: {
      name: 'dynamodb',
      identity_id: IdentityId,
      role_arn: AWS_COGNITO_ROLE_ARN,
      table_name: DYNAMODB_TABLE_NAME,
      token: Token,
      aws_region: 'us-west-2',
    },
  })
}

export default withLogging(handler)
