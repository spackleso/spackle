import type { NextApiRequest, NextApiResponse } from 'next'
import { verifySignature } from '@/stripe/signature'
import db, { features } from 'spackle-db'
import { eq } from 'drizzle-orm'

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { success } = verifySignature(req)
  if (!success) {
    return res.status(403).json({
      error: 'Unauthorized',
    })
  }

  // TODO: handle all errors
  const { account_id } = req.body

  const data = await db
    .select({
      id: features.id,
      name: features.name,
      key: features.key,
      type: features.type,
      value_flag: features.valueFlag,
      value_limit: features.valueLimit,
    })
    .from(features)
    .where(eq(features.stripeAccountId, account_id))

  res.status(200).json({
    data: data.map((f) => ({
      ...f,
      value_limit: f.value_limit ? parseFloat(f.value_limit) : null,
    })),
  })
}

export default handler
