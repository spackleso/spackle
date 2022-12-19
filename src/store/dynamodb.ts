import { getCustomerState } from '@/state'
import { supabase, SupabaseError } from '../supabase'
import { DynamoDB } from '@aws-sdk/client-dynamodb'
import { getIdentityToken } from '@/cognito'

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

export const storeAccountStates = async (stripeAccountId: string) => {
  const { data, error } = await supabase
    .from('stripe_customers')
    .select('stripe_id')
    .eq('stripe_account_id', stripeAccountId)

  if (error) {
    throw new SupabaseError(error)
  }

  const { IdentityId } = await getIdentityToken(stripeAccountId)
  if (!IdentityId) {
    throw new Error('IdentityId not set')
  }

  const client = getClient()
  for (let chunk of chunkArr(data, 25)) {
    const ops = []
    for (let { stripe_id } of chunk) {
      const state = await getCustomerState(stripeAccountId, stripe_id)
      if (!stripeAccountId || !stripe_id || !state) {
        console.log('WUT')
      }
      ops.push({
        PutRequest: {
          Item: {
            AccountId: { S: IdentityId },
            CustomerId: { S: stripe_id },
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
  const { BACKGROUND_API_TOKEN, HOST } = process.env
  await fetch(
    `${HOST}/.netlify/functions/store_account_states-background?stripe_account_id=${stripeAccountId}`,
    {
      headers: {
        authorization: `Token ${BACKGROUND_API_TOKEN}`,
      },
    },
  )
}

export const storeCustomerState = async (
  stripeAccountId: string,
  stripeCustomerId: string,
) => {
  const state = await getCustomerState(stripeAccountId, stripeCustomerId)
  const client = getClient()

  const { IdentityId } = await getIdentityToken(stripeAccountId)
  if (!IdentityId) {
    throw new Error('IdentityId not set')
  }

  await client.putItem({
    TableName: DYNAMODB_TABLE_NAME!,
    Item: {
      AccountId: { S: IdentityId },
      CustomerId: { S: stripeCustomerId },
      State: { S: JSON.stringify(state) },
    },
  })
}
