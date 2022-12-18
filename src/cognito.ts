import {
  CognitoIdentityClient,
  GetOpenIdTokenForDeveloperIdentityCommand,
} from '@aws-sdk/client-cognito-identity'

const {
  SPACKLE_AWS_ACCESS_KEY_ID,
  SPACKLE_AWS_SECRET_ACCESS_KEY,
  AWS_COGNITO_IDENTITY_POOL_ID,
  AWS_COGNITO_IDENTITY_PROVIDER,
} = process.env

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
