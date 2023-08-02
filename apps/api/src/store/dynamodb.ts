import { getCustomerState } from '@/state'
import { DynamoDB } from '@aws-sdk/client-dynamodb'
import { getQueue } from '@/queue'
import db, { stripeCustomers } from 'spackle-db'
import { eq } from 'drizzle-orm'

const {
  DYNAMODB_TABLE_NAME,
  SPACKLE_AWS_ACCESS_KEY_ID,
  SPACKLE_AWS_SECRET_ACCESS_KEY,
} = process.env

const getClient = () => {
  if (!SPACKLE_AWS_ACCESS_KEY_ID || !SPACKLE_AWS_SECRET_ACCESS_KEY) {
    throw new Error('Missing AWS credentials')
  }

  if (!DYNAMODB_TABLE_NAME) {
    throw new Error('DYNAMODB_TABLE_NAME not set')
  }

  return new DynamoDB({
    region: 'us-west-2',
    credentials: {
      accessKeyId: SPACKLE_AWS_ACCESS_KEY_ID,
      secretAccessKey: SPACKLE_AWS_SECRET_ACCESS_KEY,
    },
  })
}

const chunkArr = (arr: any[], size: number) => {
  const chunkedArr = []
  let index = 0
  while (index < arr.length) {
    chunkedArr.push(arr.slice(index, size + index))
    index += size
  }
  return chunkedArr
}

const customerKey = (customerId: string, version: number) => {
  return `${customerId}:${version}`
}

export const storeAccountStates = async (stripeAccountId: string) => {
  console.log('Storing account states for', stripeAccountId)
  const data = await db
    .select()
    .from(stripeCustomers)
    .where(eq(stripeCustomers.stripeAccountId, stripeAccountId))

  const client = getClient()
  for (let chunk of chunkArr(data, 25)) {
    const ops = []
    for (let { stripe_id } of chunk) {
      const state = await getCustomerState(stripeAccountId, stripe_id)
      ops.push({
        PutRequest: {
          Item: {
            AccountId: { S: stripeAccountId },
            CustomerId: { S: customerKey(stripe_id, state.version) },
            State: { S: JSON.stringify(state) },
          },
        },
      })
    }

    await client.batchWriteItem({
      RequestItems: {
        [DYNAMODB_TABLE_NAME!]: ops,
      },
    })
  }
}

export const storeAccountStatesAsync = async (stripeAccountId: string) => {
  const q = getQueue()
  return await q.add('storeAccountStates', { stripeAccountId })
}

export const storeCustomerState = async (
  stripeAccountId: string,
  stripeCustomerId: string,
) => {
  console.log('Storing customer state for', stripeAccountId, stripeCustomerId)
  const state = await getCustomerState(stripeAccountId, stripeCustomerId)
  const client = getClient()

  await client.putItem({
    TableName: DYNAMODB_TABLE_NAME!,
    Item: {
      AccountId: { S: stripeAccountId },
      CustomerId: { S: customerKey(stripeCustomerId, state.version) },
      State: { S: JSON.stringify(state) },
    },
  })
}

export const storeCustomerStateAsync = async (
  stripeAccountId: string,
  stripeCustomerId: string,
) => {
  const q = getQueue()
  return await q.add('storeCustomerState', {
    stripeAccountId,
    stripeCustomerId,
  })
}
