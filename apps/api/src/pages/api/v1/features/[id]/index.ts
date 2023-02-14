import { AuthenticatedNextApiRequest, getPagination, middleware } from '@/api'
import { FeatureType } from '@/types'
import { NextApiResponse } from 'next'
import supabase from 'spackle-supabase'
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

type List = {
  data: Feature[]
  has_more: boolean
}

type Error = {
  error: string
}

const handleGet = async (
  req: AuthenticatedNextApiRequest,
  res: NextApiResponse<Feature | Error>,
) => {
  let { id } = req.query

  if (!id) {
    return res.status(404).json({ error: 'Not found' })
  }

  const primaryKey = parseInt(id as string)
  const { data } = await supabase
    .from('features')
    .select('created_at, id, key, name, type, value_flag, value_limit')
    .eq('stripe_account_id', req.stripeAccountId)
    .eq(primaryKey ? 'id' : 'key', primaryKey || id)
    .maybeSingle()

  if (!data) {
    return res.status(404).json({ error: 'Not found' })
  }

  return res.status(200).json(data)
}

const handler = async (
  req: AuthenticatedNextApiRequest,
  res: NextApiResponse<List | Feature | Error>,
) => {
  return await handleGet(req, res)
}

export default middleware(handler, ['GET'])
