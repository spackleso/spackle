import {
  AuthenticatedNextApiRequest,
  getPagination,
  middleware,
  withTokenAuth,
} from '@/api'
import { NextApiResponse } from 'next'
import supabase from 'spackle-supabase'

interface Feature {
  created_at: string | null
  id: number
  key: string
  name: string
  type: number
  value_flag: boolean | null
  value_limit: number | null
}

interface Data {
  data: Feature[]
  has_more: boolean
}

interface Error {
  error: string
}

const handler = async (
  req: AuthenticatedNextApiRequest,
  res: NextApiResponse<Data | Error>,
) => {
  const { from, to } = getPagination(req, 10)
  const { data, error } = await supabase
    .from('features')
    .select('created_at, id, key, name, type, value_flag, value_limit')
    .eq('stripe_account_id', req.accountId)
    .order('id', { ascending: true })
    .range(from, to)

  if (error || !data) {
    return res.status(400).json({ error: error.message })
  }

  const hasMore = data.length > 10
  return res.status(200).json({ data: data.slice(0, 10), has_more: hasMore })
}

export default middleware(handler, ['GET'])
