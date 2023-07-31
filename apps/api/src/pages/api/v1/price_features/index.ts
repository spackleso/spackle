import { AuthenticatedNextApiRequest, getPagination, middleware } from '@/api'
import { storeAccountStatesAsync } from '@/store/dynamodb'
import { NextApiResponse } from 'next'
import db, { priceFeatures } from 'spackle-db'
import { z } from 'zod'
import { eq } from 'drizzle-orm'

const createFlagPriceFeatureSchema = z.object({
  feature_id: z.number(),
  stripe_price_id: z.string(),
  value_flag: z.boolean(),
  value_limit: z.null().optional(),
})

const createLimitPriceFeatureSchema = z.object({
  feature_id: z.number(),
  stripe_price_id: z.string(),
  value_flag: z.null().optional(),
  value_limit: z.number().nullable(),
})

const createPriceFeatureSchema = z.union([
  createFlagPriceFeatureSchema,
  createLimitPriceFeatureSchema,
])

const priceFeatureSchema = z.object({
  created_at: z.string().nullable(),
  feature_id: z.number(),
  id: z.number(),
  stripe_price_id: z.string(),
  value_flag: z.boolean().nullable(),
  value_limit: z.number().nullable(),
})

type PriceFeature = z.infer<typeof priceFeatureSchema>

type List = {
  data: PriceFeature[]
  has_more: boolean
}

type FlattenedErrors = z.inferFlattenedErrors<typeof createPriceFeatureSchema>

type Error = {
  error: string | FlattenedErrors
}

const handlePost = async (
  req: AuthenticatedNextApiRequest,
  res: NextApiResponse<PriceFeature | Error>,
) => {
  const validation = createPriceFeatureSchema.safeParse(req.body)
  if (!validation.success) {
    return res.status(400).json({
      error: validation.error.flatten(),
    })
  }

  const result = await db
    .insert(priceFeatures)
    .values({
      stripeAccountId: req.stripeAccountId,
      stripePriceId: validation.data.stripe_price_id,
      featureId: validation.data.feature_id,
      valueFlag: validation.data.value_flag,
      valueLimit:
        validation.data.value_limit === null ||
        validation.data.value_limit === undefined
          ? null
          : validation.data.value_limit.toString(),
    })
    .returning()

  await storeAccountStatesAsync(req.stripeAccountId)
  const priceFeature = result[0]
  return res.status(201).json({
    created_at: priceFeature.createdAt,
    feature_id: priceFeature.featureId,
    id: priceFeature.id,
    stripe_price_id: priceFeature.stripePriceId,
    value_flag: priceFeature.valueFlag,
    value_limit: priceFeature.valueLimit
      ? parseFloat(priceFeature.valueLimit)
      : null,
  })
}

const handleGet = async (
  req: AuthenticatedNextApiRequest,
  res: NextApiResponse<List | Error>,
) => {
  const { from, limit } = getPagination(req, 10)
  const result = await db
    .select({
      created_at: priceFeatures.createdAt,
      feature_id: priceFeatures.featureId,
      id: priceFeatures.id,
      stripe_price_id: priceFeatures.stripePriceId,
      value_flag: priceFeatures.valueFlag,
      value_limit: priceFeatures.valueLimit,
    })
    .from(priceFeatures)
    .where(eq(priceFeatures.stripeAccountId, req.stripeAccountId))
    .orderBy(priceFeatures.id)
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
  res: NextApiResponse<List | PriceFeature | Error>,
) => {
  if (req.method === 'POST') {
    return await handlePost(req, res)
  } else {
    return await handleGet(req, res)
  }
}

export default middleware(handler, ['GET', 'POST'])
