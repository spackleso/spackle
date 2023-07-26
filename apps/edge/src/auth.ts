import {
  CognitoIdentityClient,
  GetOpenIdTokenForDeveloperIdentityCommand,
} from '@aws-sdk/client-cognito-identity'
import jwt from 'jsonwebtoken'
import { IncomingHttpHeaders } from 'http'

const {
  AWS_COGNITO_IDENTITY_POOL_ID,
  AWS_COGNITO_IDENTITY_PROVIDER,
  SPACKLE_AWS_ACCESS_KEY_ID,
  SPACKLE_AWS_SECRET_ACCESS_KEY,
  SUPABASE_JWT_SECRET,
} = process.env

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

export const getIdentityToken = async (accountId: string) => {
  if (
    !SPACKLE_AWS_ACCESS_KEY_ID ||
    !SPACKLE_AWS_SECRET_ACCESS_KEY ||
    !AWS_COGNITO_IDENTITY_POOL_ID ||
    !AWS_COGNITO_IDENTITY_PROVIDER
  ) {
    throw new Error('Missing AWS credentials')
  }

  const client = new CognitoIdentityClient({
    region: 'us-west-2',
    credentials: {
      accessKeyId: SPACKLE_AWS_ACCESS_KEY_ID,
      secretAccessKey: SPACKLE_AWS_SECRET_ACCESS_KEY,
    },
  })

  const command = new GetOpenIdTokenForDeveloperIdentityCommand({
    IdentityPoolId: AWS_COGNITO_IDENTITY_POOL_ID,
    Logins: {
      [AWS_COGNITO_IDENTITY_PROVIDER]: accountId,
    },
  })

  return await client.send(command)
}
