import {
  CognitoIdentityClient,
  GetOpenIdTokenForDeveloperIdentityCommand,
} from '@aws-sdk/client-cognito-identity'

const { SPACKLE_AWS_ACCESS_KEY_ID, SPACKLE_AWS_SECRET_ACCESS_KEY } = process.env

export const getIdentityToken = async (accountId: string) => {
  if (!SPACKLE_AWS_ACCESS_KEY_ID || !SPACKLE_AWS_SECRET_ACCESS_KEY) {
    throw new Error('Missing AWS credentials')
  }

  const client = new CognitoIdentityClient({
    credentials: {
      accessKeyId: SPACKLE_AWS_ACCESS_KEY_ID,
      secretAccessKey: SPACKLE_AWS_SECRET_ACCESS_KEY,
    },
  })
  const command = new GetOpenIdTokenForDeveloperIdentityCommand({
    IdentityPoolId: process.env.AWS_COGNITO_IDENTITY_POOL_ID || '',
    Logins: {
      [process.env.AWS_COGNITO_IDENTITY_PROVIDER || '']: accountId,
    },
  })

  return await client.send(command)
}
