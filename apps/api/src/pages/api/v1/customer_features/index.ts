import { AuthenticatedNextApiRequest, getPagination, middleware } from '@/api'
import { storeAccountStatesAsync } from '@/store/dynamodb'
import { NextApiResponse } from 'next'
import supabase from 'spackle-supabase'
import { z } from 'zod'

const createFlagCustomerFeatureSchema = z.object({
  feature_id: z.number(),
  stripe_customer_id: z.string(),
  value_flag: z.boolean(),
})

const createLimitCustomerFeatureSchema = z.object({
  feature_id: z.number(),
  stripe_customer_id: z.string(),
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

  const { data: customerFeatures, error } = await supabase
    .from('customer_features')
    .insert({
      stripe_account_id: req.stripeAccountId,
      ...validation.data,
    })
    .select()

  if (error || !customerFeatures) {
    return res.status(400).json({ error: error.message })
  }

  await storeAccountStatesAsync(req.stripeAccountId)
  const customerFeature = customerFeatures[0]
  return res.status(201).json({
    created_at: customerFeature.created_at,
    feature_id: customerFeature.feature_id,
    id: customerFeature.id,
    stripe_customer_id: customerFeature.stripe_customer_id,
    value_flag: customerFeature.value_flag,
    value_limit: customerFeature.value_limit,
  })
}

const handleGet = async (
  req: AuthenticatedNextApiRequest,
  res: NextApiResponse<List | Error>,
) => {
  const { from, to } = getPagination(req, 10)
  const { data, error } = await supabase
    .from('customer_features')
    .select(
      'created_at, feature_id, id, stripe_customer_id, value_flag, value_limit',
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
  res: NextApiResponse<List | CustomerFeature | Error>,
) => {
  if (req.method === 'POST') {
    return await handlePost(req, res)
  } else {
    return await handleGet(req, res)
  }
}

export default middleware(handler, ['GET', 'POST'])
