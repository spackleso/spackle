import { AuthenticatedNextApiRequest, getPagination, middleware } from '@/api'
import { storeAccountStatesAsync } from '@/store/dynamodb'
import { NextApiResponse } from 'next'
import supabase from 'spackle-supabase'
import { z } from 'zod'

enum FeatureType {
  Flag = 0,
  Limit = 1,
}

const createFeatureSchema = z.discriminatedUnion('type', [
  z.object({
    name: z.string(),
    key: z.string(),
    type: z.literal(FeatureType.Flag),
    value_flag: z.boolean(),
  }),
  z.object({
    name: z.string(),
    key: z.string(),
    type: z.literal(FeatureType.Limit),
    value_limit: z.number(),
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

  const { data: features, error } = await supabase
    .from('features')
    .insert({
      stripe_account_id: req.stripeAccountId,
      ...validation.data,
    })
    .select()

  if (error || !features) {
    return res.status(400).json({ error: error.message })
  }

  await storeAccountStatesAsync(req.stripeAccountId)
  const feature = features[0]
  return res.status(201).json({
    created_at: feature.created_at,
    id: feature.id,
    key: feature.key,
    name: feature.name,
    type: feature.type,
    value_flag: feature.value_flag,
    value_limit: feature.value_limit,
  })
}

const handleGet = async (
  req: AuthenticatedNextApiRequest,
  res: NextApiResponse<List | Error>,
) => {
  const { from, to } = getPagination(req, 10)
  const { data, error } = await supabase
    .from('features')
    .select('created_at, id, key, name, type, value_flag, value_limit')
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
  res: NextApiResponse<List | Feature | Error>,
) => {
  if (req.method === 'POST') {
    return await handlePost(req, res)
  } else {
    return await handleGet(req, res)
  }
}

export default middleware(handler, ['GET', 'POST'])
