import { AuthenticatedNextApiRequest, getPagination, middleware } from '@/api'
import { storeAccountStatesAsync } from '@/store/dynamodb'
import { NextApiResponse } from 'next'
import db, { productFeatures } from 'spackle-db'
import { z } from 'zod'
import { eq } from 'drizzle-orm'

const createFlagProductFeatureSchema = z.object({
  feature_id: z.number(),
  stripe_product_id: z.string(),
  value_flag: z.boolean(),
  value_limit: z.null().optional(),
})

const createLimitProductFeatureSchema = z.object({
  feature_id: z.number(),
  stripe_product_id: z.string(),
  value_flag: z.null().optional(),
  value_limit: z.number().nullable(),
})

const createProductFeatureSchema = z.union([
  createFlagProductFeatureSchema,
  createLimitProductFeatureSchema,
])

const productFeatureSchema = z.object({
  created_at: z.string().nullable(),
  feature_id: z.number(),
  id: z.number(),
  stripe_product_id: z.string(),
  value_flag: z.boolean().nullable(),
  value_limit: z.number().nullable(),
})

type ProductFeature = z.infer<typeof productFeatureSchema>

type List = {
  data: ProductFeature[]
  has_more: boolean
}

type FlattenedErrors = z.inferFlattenedErrors<typeof createProductFeatureSchema>

type Error = {
  error: string | FlattenedErrors
}

const handlePost = async (
  req: AuthenticatedNextApiRequest,
  res: NextApiResponse<ProductFeature | Error>,
) => {
  const validation = createProductFeatureSchema.safeParse(req.body)
  if (!validation.success) {
    return res.status(400).json({
      error: validation.error.flatten(),
    })
  }

  const result = await db
    .insert(productFeatures)
    .values({
      stripeAccountId: req.stripeAccountId,
      stripeProductId: validation.data.stripe_product_id,
      featureId: validation.data.feature_id,
      valueFlag: validation.data.value_flag,
      valueLimit: validation.data.value_limit,
    })
    .returning()

  await storeAccountStatesAsync(req.stripeAccountId)
  const productFeature = result[0]
  return res.status(201).json({
    created_at: productFeature.createdAt,
    feature_id: productFeature.featureId,
    id: productFeature.id,
    stripe_product_id: productFeature.stripeProductId,
    value_flag: productFeature.valueFlag,
    value_limit: productFeature.valueLimit,
  })
}

const handleGet = async (
  req: AuthenticatedNextApiRequest,
  res: NextApiResponse<List | Error>,
) => {
  const { from, limit } = getPagination(req, 10)
  const result = await db
    .select({
      created_at: productFeatures.createdAt,
      feature_id: productFeatures.featureId,
      id: productFeatures.id,
      stripe_product_id: productFeatures.stripeProductId,
      value_flag: productFeatures.valueFlag,
      value_limit: productFeatures.valueLimit,
    })
    .from(productFeatures)
    .where(eq(productFeatures.stripeAccountId, req.stripeAccountId))
    .orderBy(productFeatures.id)
    .limit(limit)
    .offset(from)

  const hasMore = result.length > 10
  return res.status(200).json({
    data: result.slice(0, 10),
    has_more: hasMore,
  })
}

const handler = async (
  req: AuthenticatedNextApiRequest,
  res: NextApiResponse<List | ProductFeature | Error>,
) => {
  if (req.method === 'POST') {
    return await handlePost(req, res)
  } else {
    return await handleGet(req, res)
  }
}

export default middleware(handler, ['GET', 'POST'])
