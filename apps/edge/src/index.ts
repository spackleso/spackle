import * as Sentry from '@sentry/node'
import * as dotenv from 'dotenv'
import express from 'express'
import jwt from 'jsonwebtoken'
import { DynamoDBClient, GetItemCommand } from '@aws-sdk/client-dynamodb'
import {
  CognitoIdentityClient,
  GetOpenIdTokenForDeveloperIdentityCommand,
} from '@aws-sdk/client-cognito-identity'
import { IncomingHttpHeaders } from 'http'

try {
  dotenv.config({ path: __dirname + '/.env' })
} catch (error) {}

const app = express()

const {
  AWS_COGNITO_IDENTITY_POOL_ID,
  AWS_COGNITO_IDENTITY_PROVIDER,
  AWS_REGION,
  DYNAMODB_TABLE_NAME,
  PORT,
  SPACKLE_AWS_ACCESS_KEY_ID,
  SPACKLE_AWS_SECRET_ACCESS_KEY,
  SUPABASE_JWT_SECRET,
} = process.env

const client = new DynamoDBClient({
  region: AWS_REGION ?? '',
  credentials: {
    accessKeyId: SPACKLE_AWS_ACCESS_KEY_ID ?? '',
    secretAccessKey: SPACKLE_AWS_SECRET_ACCESS_KEY ?? '',
  },
})

Sentry.init({
  dsn: 'https://1df7ea7ed7c346b6a6609088e1ffe2c2@o271958.ingest.sentry.io/4505575227129856',
  integrations: [
    // enable HTTP calls tracing
    new Sentry.Integrations.Http({
      tracing: true,
    }),
    // enable Express.js middleware tracing
    new Sentry.Integrations.Express({
      app,
    }),
  ],
  // Performance Monitoring
  tracesSampleRate: 1.0, // Capture 100% of the transactions, reduce in production!,
})

app.use(Sentry.Handlers.requestHandler())
app.use(Sentry.Handlers.tracingHandler())

app.get('/', (req, res) => {
  res.send('')
})

app.get('/customers/:id/state', async (req, res) => {
  console.time('request')
  let accountId: string = ''
  try {
    const { sub } = requestToken(req.headers)
    accountId = sub
  } catch (error) {
    res.status(401).send('')
    console.timeEnd('request')
    return
  }

  const { IdentityId } = await getIdentityToken(accountId)
  if (!IdentityId) {
    res.status(401).send('')
    console.timeEnd('request')
    return
  }

  const schemaVersion = req.headers['x-spackle-schema-version'] ?? '1'
  const item = await client.send(
    new GetItemCommand({
      TableName: DYNAMODB_TABLE_NAME,
      Key: {
        AccountId: {
          S: IdentityId,
        },
        CustomerId: {
          S: `${req.params.id}:${schemaVersion}`,
        },
      },
    }),
  )

  if (item.Item?.State.S) {
    res.end(item.Item?.State.S)
  } else {
    res.status(404).send('')
  }
  console.timeEnd('request')
})

app.use(Sentry.Handlers.errorHandler())

app.use(function onError(err: any, req: any, res: any, next: any) {
  res.statusCode = 500
  res.end(res.sentry + '\n')
})

app.listen(PORT || 3003, () => {
  console.log(`The application is listening on port ${PORT || 3003}!`)
})

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

const getIdentityToken = async (accountId: string) => {
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
