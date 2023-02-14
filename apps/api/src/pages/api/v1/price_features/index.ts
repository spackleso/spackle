import { AuthenticatedNextApiRequest, getPagination, middleware } from '@/api'
import { storeAccountStatesAsync } from '@/store/dynamodb'
import { NextApiResponse } from 'next'
import supabase from 'spackle-supabase'
import { z } from 'zod'

const createFlagPriceFeatureSchema = z.object({
  feature_id: z.number(),
  stripe_price_id: z.string(),
  value_flag: z.boolean(),
})

const createLimitPriceFeatureSchema = z.object({
  feature_id: z.number(),
  stripe_price_id: z.string(),
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

  const { data: priceFeatures, error } = await supabase
    .from('price_features')
    .insert({
      stripe_account_id: req.stripeAccountId,
      ...validation.data,
    })
    .select()

  if (error || !priceFeatures) {
    return res.status(400).json({ error: error.message })
  }

  await storeAccountStatesAsync(req.stripeAccountId)
  const priceFeature = priceFeatures[0]
  return res.status(201).json({
    created_at: priceFeature.created_at,
    feature_id: priceFeature.feature_id,
    id: priceFeature.id,
    stripe_price_id: priceFeature.stripe_price_id,
    value_flag: priceFeature.value_flag,
    value_limit: priceFeature.value_limit,
  })
}

const handleGet = async (
  req: AuthenticatedNextApiRequest,
  res: NextApiResponse<List | Error>,
) => {
  const { from, to } = getPagination(req, 10)
  const { data, error } = await supabase
    .from('price_features')
    .select(
      'created_at, feature_id, id, stripe_price_id, value_flag, value_limit',
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
  res: NextApiResponse<List | PriceFeature | Error>,
) => {
  if (req.method === 'POST') {
    return await handlePost(req, res)
  } else {
    return await handleGet(req, res)
  }
}

export default middleware(handler, ['GET', 'POST'])
