import express from 'express'
import { IncomingHttpHeaders } from 'http'
import jwt from 'jsonwebtoken'
import * as dotenv from 'dotenv'
import { DynamoDBClient, GetItemCommand } from '@aws-sdk/client-dynamodb'

dotenv.config({ path: __dirname + '/.env' })

const app = express()

const {
  SUPABASE_JWT_SECRET,
  DYNAMODB_TABLE_NAME,
  SPACKLE_AWS_ACCESS_KEY_ID,
  SPACKLE_AWS_SECRET_ACCESS_KEY,
} = process.env
const port = process.env.PORT || 3003
const identityId = 'us-west-2:975730cb-224e-4896-bc1c-987bf15c8986'
const client = new DynamoDBClient({
  region: 'us-west-2',
  credentials: {
    accessKeyId: SPACKLE_AWS_ACCESS_KEY_ID ?? '',
    secretAccessKey: SPACKLE_AWS_SECRET_ACCESS_KEY ?? '',
  },
})

app.get('/', (req, res) => {
  res.send('')
})

app.get('/customers/:id/state', async (req, res) => {
  try {
    requestToken(req.headers)
  } catch (error) {
    res.status(401).send('')
    return
  }

  const item = await client.send(
    new GetItemCommand({
      TableName: DYNAMODB_TABLE_NAME,
      Key: {
        AccountId: {
          S: identityId,
        },
        CustomerId: {
          S: `${req.params.id}:1`,
        },
      },
    }),
  )

  res.json(item.Item?.State.S)
})

app.listen(port, () => {
  console.log(`The application is listening on port ${port}!`)
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
