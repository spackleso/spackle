import { program } from 'commander'
import {
  CognitoIdentityClient,
  GetOpenIdTokenForDeveloperIdentityCommand,
} from '@aws-sdk/client-cognito-identity'

program.argument('<account_id>')
program.parse()

const [accountId] = program.args

const { SPACKLE_AWS_ACCESS_KEY_ID, SPACKLE_AWS_SECRET_ACCESS_KEY } = process.env

async function main(accountId: string) {
  if (!SPACKLE_AWS_ACCESS_KEY_ID || !SPACKLE_AWS_SECRET_ACCESS_KEY) {
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
    IdentityPoolId: process.env.AWS_COGNITO_IDENTITY_POOL_ID || '',
    Logins: {
      [process.env.AWS_COGNITO_IDENTITY_PROVIDER || '']: accountId,
    },
  })
  const response = await client.send(command)
  console.log(response)
}

main(accountId)
