import {
  CognitoIdentityClient,
  GetOpenIdTokenForDeveloperIdentityCommand,
} from '@aws-sdk/client-cognito-identity'

export const getIdentityToken = async (accountId: string) => {
  const client = new CognitoIdentityClient({
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
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
