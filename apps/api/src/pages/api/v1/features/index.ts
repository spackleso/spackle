import { AuthenticatedNextApiRequest, getPagination, middleware } from '@/api'
import { storeAccountStatesAsync } from '@/store/dynamodb'
import { FeatureType } from '@/types'
import { eq } from 'drizzle-orm'
import { NextApiResponse } from 'next'
import db, { features } from 'spackle-db'
import { z } from 'zod'

const createFeatureSchema = z.discriminatedUnion('type', [
  z.object({
    name: z.string(),
    key: z.string(),
    type: z.literal(FeatureType.Flag),
    value_flag: z.boolean().nullable(),
    value_limit: z.null().optional(),
  }),
  z.object({
    name: z.string(),
    key: z.string(),
    type: z.literal(FeatureType.Limit),
    value_flag: z.null().optional(),
    value_limit: z.number().nullable(),
  }),
])

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

type List = {
  data: Feature[]
  has_more: boolean
}

type FlattenedErrors = z.inferFlattenedErrors<typeof createFeatureSchema>

type Error = {
  error: string | FlattenedErrors
}

const handlePost = async (
  req: AuthenticatedNextApiRequest,
  res: NextApiResponse<Feature | Error>,
) => {
  const validation = createFeatureSchema.safeParse(req.body)
  if (!validation.success) {
    return res.status(400).json({
      error: validation.error.flatten(),
    })
  }

  const result = await db
    .insert(features)
    .values({
      stripeAccountId: req.stripeAccountId,
      key: validation.data.key,
      name: validation.data.name,
      type: validation.data.type,
      valueFlag: validation.data.value_flag,
      valueLimit:
        validation.data.value_limit === null ||
        validation.data.value_limit === undefined
          ? null
          : validation.data.value_limit.toString(),
    })
    .returning()

  await storeAccountStatesAsync(req.stripeAccountId)
  const feature = result[0]
  return res.status(201).json({
    created_at: feature.createdAt,
    id: feature.id,
    key: feature.key,
    name: feature.name,
    type: feature.type,
    value_flag: feature.valueFlag,
    value_limit: feature.valueLimit ? parseFloat(feature.valueLimit) : null,
  })
}

const handleGet = async (
  req: AuthenticatedNextApiRequest,
  res: NextApiResponse<List | Error>,
) => {
  const { from, limit } = getPagination(req, 10)
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
    .where(eq(features.stripeAccountId, req.stripeAccountId))
    .orderBy(features.id)
    .limit(limit)
    .offset(from)

  const hasMore = result.length > 10
  return res.status(200).json({
    data: result.slice(0, 10).map((f) => ({
      ...f,
      value_limit: f.value_limit ? parseFloat(f.value_limit) : null,
    })),
    has_more: hasMore,
  })
}

const handler = async (
  req: AuthenticatedNextApiRequest,
  res: NextApiResponse<List | Feature | Error>,
) => {
  if (req.method === 'POST') {
    return await handlePost(req, res)
  } else {
    return await handleGet(req, res)
  }
}

export default middleware(handler, ['GET', 'POST'])
