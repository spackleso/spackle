import { AuthenticatedNextApiRequest, middleware } from '@/api'
import { FeatureType } from '@/types'
import { and, eq } from 'drizzle-orm'
import { NextApiResponse } from 'next'
import db, { features } from 'spackle-db'
import { z } from 'zod'

const featureSchema = z.object({
  created_at: z.string().nullable(),
  id: z.number(),
  key: z.string(),
  name: z.string(),
  type: z.nativeEnum(FeatureType),
  value_flag: z.boolean().nullable(),
  value_limit: z.number().nullable(),
})

type Feature = z.infer<typeof featureSchema>

type Error = {
  error: string
}

const handleGet = async (
  req: AuthenticatedNextApiRequest,
  res: NextApiResponse<Feature | Error>,
) => {
  let id: string | undefined = req.query.id as string | undefined

  if (!id) {
    return res.status(404).json({ error: 'Not found' })
  }

  const primaryKey = parseInt(id as string)
  const result = await db
    .select({
      created_at: features.createdAt,
      id: features.id,
      key: features.key,
      name: features.name,
      type: features.type,
      value_flag: features.valueFlag,
      value_limit: features.valueLimit,
    })
    .from(features)
    .where(
      and(
        eq(features.stripeAccountId, req.stripeAccountId),
        eq(features[primaryKey ? 'id' : 'key'], primaryKey || id),
      ),
    )

  if (!result.length) {
    return res.status(404).json({ error: 'Not found' })
  }

  const feature = result[0]
  return res.status(200).json(feature)
}

const handler = async (
  req: AuthenticatedNextApiRequest,
  res: NextApiResponse<Feature | Error>,
) => {
  return await handleGet(req, res)
}

export default middleware(handler, ['GET'])
