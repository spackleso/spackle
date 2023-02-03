import {
  AuthenticatedNextApiRequest,
  getPagination,
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
}

interface Error {
  error: string
}

const handler = async (
  req: AuthenticatedNextApiRequest,
  res: NextApiResponse<Data | Error>,
) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  const { from, to } = getPagination(parseInt(req.query.page || 1), 10)
  const { data, error } = await supabase
    .from('features')
    .select('created_at, id, key, name, type, value_flag, value_limit')
    .eq('stripe_account_id', req.accountId)
    .order('id', { ascending: true })
    .range(from, to)

  if (error || !data) {
    return res.status(400).json({ error: error.message })
  }

  return res.status(200).json({ data })
}

export default withTokenAuth(handler)
