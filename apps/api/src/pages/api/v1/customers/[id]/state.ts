import { NextApiResponse } from 'next'
import { AuthenticatedNextApiRequest, middleware } from '@/api'
import { getCustomerState } from '@/state'
import supabase from 'spackle-supabase'
import { storeCustomerStateAsync } from '@/store/dynamodb'
import { syncStripeCustomer, syncStripeSubscriptions } from '@/stripe/sync'

type Data = {}

const fetchAndSyncNewCustomer = async (
  stripeAccountId: string,
  stripeCustomerId: string,
) => {
  let customer
  try {
    customer = await syncStripeCustomer(
      stripeAccountId,
      stripeCustomerId,
      'live',
    )
  } catch (error) {
    try {
      customer = await syncStripeCustomer(
        stripeAccountId,
        stripeCustomerId,
        'test',
      )
    } catch (error) {}
  }

  if (!customer) {
    return null
  }

  try {
    await syncStripeSubscriptions(stripeAccountId, customer.stripe_id, 'live')
  } catch (error) {
    await syncStripeSubscriptions(stripeAccountId, customer.stripe_id, 'test')
  }

  return customer
}

const handler = async (
  req: AuthenticatedNextApiRequest,
  res: NextApiResponse<Data>,
) => {
  const { id } = req.query

  let { data: customer } = await supabase
    .from('stripe_customers')
    .select()
    .eq('stripe_id', id as string)
    .eq('stripe_account_id', req.stripeAccountId)
    .maybeSingle()

  if (!customer) {
    customer = await fetchAndSyncNewCustomer(req.stripeAccountId, id as string)
  }

  if (!customer) {
    return res.status(404).json({ error: 'Not found' })
  }

  try {
    const state = await getCustomerState(req.stripeAccountId, id as string)
    await storeCustomerStateAsync(req.stripeAccountId, id as string)
    return res.status(200).json(state)
  } catch (error) {
    return res.status(400).json({ error })
  }
}

export default middleware(handler, ['GET'])
