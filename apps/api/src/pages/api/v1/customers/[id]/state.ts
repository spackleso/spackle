import { NextApiResponse } from 'next'
import { AuthenticatedNextApiRequest, middleware } from '@/api'
import { getCustomerState } from '@/state'
import { storeCustomerStateAsync } from '@/store/dynamodb'
import { syncStripeCustomer, syncStripeSubscriptions } from '@/stripe/sync'
import db, { stripeCustomers } from 'spackle-db'
import { and, eq } from 'drizzle-orm'

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
    await syncStripeSubscriptions(stripeAccountId, customer.stripeId, 'live')
  } catch (error) {
    await syncStripeSubscriptions(stripeAccountId, customer.stripeId, 'test')
  }

  return customer
}

const handler = async (
  req: AuthenticatedNextApiRequest,
  res: NextApiResponse<Data>,
) => {
  const { id } = req.query

  const customers = await db
    .select()
    .from(stripeCustomers)
    .where(
      and(
        eq(stripeCustomers.stripeId, id as string),
        eq(stripeCustomers.stripeAccountId, req.stripeAccountId),
      ),
    )

  let customer
  if (customers.length) {
    customer = customers[0]
  } else {
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
    console.log(error)
    return res.status(400).json({ error })
  }
}

export default middleware(handler, ['GET'])
