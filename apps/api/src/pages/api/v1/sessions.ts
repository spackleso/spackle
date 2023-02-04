import { NextApiResponse } from 'next'
import { getIdentityToken } from '@/cognito'
import { AuthenticatedNextApiRequest, middleware } from '@/api'

const { DYNAMODB_TABLE_NAME, AWS_COGNITO_ROLE_ARN } = process.env

interface DynamoDBAdapter {
  name: string
  identity_id: string
  role_arn: string
  table_name: string
  token: string
  region: string
}

interface Data {
  account_id: string
  adapter: DynamoDBAdapter
}

interface Error {
  error: string
}

const handler = async (
  req: AuthenticatedNextApiRequest,
  res: NextApiResponse<Data | Error>,
) => {
  const { Token, IdentityId } = await getIdentityToken(req.accountId)
  if (!Token || !IdentityId || !DYNAMODB_TABLE_NAME || !AWS_COGNITO_ROLE_ARN) {
    return res.status(400).json({ error: 'Configuration error' })
  }

  return res.status(200).json({
    account_id: req.accountId,
    adapter: {
      name: 'dynamodb',
      identity_id: IdentityId,
      role_arn: AWS_COGNITO_ROLE_ARN,
      table_name: DYNAMODB_TABLE_NAME,
      token: Token,
      region: 'us-west-2',
    },
  })
}

export default middleware(handler, ['POST'])
