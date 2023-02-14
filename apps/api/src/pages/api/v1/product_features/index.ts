import { AuthenticatedNextApiRequest, getPagination, middleware } from '@/api'
import { storeAccountStatesAsync } from '@/store/dynamodb'
import { NextApiResponse } from 'next'
import supabase from 'spackle-supabase'
import { z } from 'zod'

const createFlagProductFeatureSchema = z.object({
  feature_id: z.number(),
  stripe_product_id: z.string(),
  value_flag: z.boolean(),
})

const createLimitProductFeatureSchema = z.object({
  feature_id: z.number(),
  stripe_product_id: z.string(),
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

  const { data: productFeatures, error } = await supabase
    .from('product_features')
    .insert({
      stripe_account_id: req.stripeAccountId,
      ...validation.data,
    })
    .select()

  if (error || !productFeatures) {
    return res.status(400).json({ error: error.message })
  }

  await storeAccountStatesAsync(req.stripeAccountId)
  const productFeature = productFeatures[0]
  return res.status(201).json({
    created_at: productFeature.created_at,
    feature_id: productFeature.feature_id,
    id: productFeature.id,
    stripe_product_id: productFeature.stripe_product_id,
    value_flag: productFeature.value_flag,
    value_limit: productFeature.value_limit,
  })
}

const handleGet = async (
  req: AuthenticatedNextApiRequest,
  res: NextApiResponse<List | Error>,
) => {
  const { from, to } = getPagination(req, 10)
  const { data, error } = await supabase
    .from('product_features')
    .select(
      'created_at, feature_id, id, stripe_product_id, value_flag, value_limit',
    )
    .eq('stripe_account_id', req.stripeAccountId)
    .order('id', { ascending: true })
    .range(from, to)

  if (error || !data) {
    return res.status(400).json({ error: error.message })
  }

  const hasMore = data.length > 10
  return res.status(200).json({ data: data.slice(0, 10), has_more: hasMore })
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
