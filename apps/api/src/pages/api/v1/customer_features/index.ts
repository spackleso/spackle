import { AuthenticatedNextApiRequest, getPagination, middleware } from '@/api'
import { storeAccountStatesAsync } from '@/store/dynamodb'
import { eq } from 'drizzle-orm'
import { NextApiResponse } from 'next'
import db, { customerFeatures } from 'spackle-db'
import { z } from 'zod'

const createFlagCustomerFeatureSchema = z.object({
  feature_id: z.number(),
  stripe_customer_id: z.string(),
  value_flag: z.boolean().nullable(),
  value_limit: z.null().optional(),
})

const createLimitCustomerFeatureSchema = z.object({
  feature_id: z.number(),
  stripe_customer_id: z.string(),
  value_flag: z.null().optional(),
  value_limit: z.number().nullable(),
})

const createCustomerFeatureSchema = z.union([
  createFlagCustomerFeatureSchema,
  createLimitCustomerFeatureSchema,
])

const customerFeatureSchema = z.object({
  created_at: z.string().nullable(),
  feature_id: z.number(),
  id: z.number(),
  stripe_customer_id: z.string(),
  value_flag: z.boolean().nullable(),
  value_limit: z.number().nullable(),
})

type CustomerFeature = z.infer<typeof customerFeatureSchema>

type List = {
  data: CustomerFeature[]
  has_more: boolean
}

type FlattenedErrors = z.inferFlattenedErrors<
  typeof createCustomerFeatureSchema
>

type Error = {
  error: string | FlattenedErrors
}

const handlePost = async (
  req: AuthenticatedNextApiRequest,
  res: NextApiResponse<CustomerFeature | Error>,
) => {
  const validation = createCustomerFeatureSchema.safeParse(req.body)
  if (!validation.success) {
    return res.status(400).json({
      error: validation.error.flatten(),
    })
  }

  const result = await db
    .insert(customerFeatures)
    .values({
      stripeAccountId: req.stripeAccountId,
      stripeCustomerId: validation.data.stripe_customer_id,
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
  const customerFeature = result[0]
  return res.status(201).json({
    created_at: customerFeature.createdAt,
    feature_id: customerFeature.featureId,
    id: customerFeature.id,
    stripe_customer_id: customerFeature.stripeCustomerId,
    value_flag: customerFeature.valueFlag,
    value_limit: customerFeature.valueLimit
      ? parseFloat(customerFeature.valueLimit)
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
      created_at: customerFeatures.createdAt,
      feature_id: customerFeatures.featureId,
      id: customerFeatures.id,
      stripe_customer_id: customerFeatures.stripeCustomerId,
      value_flag: customerFeatures.valueFlag,
      value_limit: customerFeatures.valueLimit,
    })
    .from(customerFeatures)
    .where(eq(customerFeatures.stripeAccountId, req.stripeAccountId))
    .orderBy(customerFeatures.id)
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
  res: NextApiResponse<List | CustomerFeature | Error>,
) => {
  if (req.method === 'POST') {
    return await handlePost(req, res)
  } else {
    return await handleGet(req, res)
  }
}

export default middleware(handler, ['GET', 'POST'])
