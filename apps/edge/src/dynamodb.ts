import { DynamoDBClient, GetItemCommand } from '@aws-sdk/client-dynamodb'

const {
  AWS_REGION,
  DYNAMODB_TABLE_NAME,
  SPACKLE_AWS_ACCESS_KEY_ID,
  SPACKLE_AWS_SECRET_ACCESS_KEY,
} = process.env

export const client = new DynamoDBClient({
  region: AWS_REGION ?? '',
  credentials: {
    accessKeyId: SPACKLE_AWS_ACCESS_KEY_ID ?? '',
    secretAccessKey: SPACKLE_AWS_SECRET_ACCESS_KEY ?? '',
  },
})

export const getCustomerState = async (
  accountId: string,
  customerId: string,
  schemaVersion: number,
) => {
  const item = await client.send(
    new GetItemCommand({
      TableName: DYNAMODB_TABLE_NAME,
      Key: {
        AccountId: {
          S: accountId,
        },
        CustomerId: {
          S: `${customerId}:${schemaVersion}`,
        },
      },
    }),
  )

  return item.Item?.State.S
}
