import { NextApiResponse } from 'next'
import { getCustomerFeaturesState } from '@/state'
import supabase from 'spackle-supabase'
import * as Sentry from '@sentry/nextjs'
import { AuthenticatedNextApiRequest, middleware } from '@/api'

type Data = {}

const getCustomerSubscriptions = async (
  accountId: string,
  customerId: string,
) => {
  const { data, error } = await supabase
    .from('stripe_subscription_items')
    .select(
      `
        stripe_subscriptions!inner(
          *
        ),
        stripe_prices!inner(
          stripe_json,
          stripe_products!inner(
            stripe_json
          )
        )
      `,
    )
    .eq('stripe_account_id', accountId)
    .eq('stripe_subscriptions.stripe_customer_id', customerId)

  if (error) {
    throw new Error(error.message)
  }

  return data.map((item: any) => ({
    id: item.stripe_subscriptions.stripe_id,
    product: JSON.parse(item.stripe_prices.stripe_products.stripe_json),
    price: JSON.parse(item.stripe_prices.stripe_json),
    status: item.stripe_subscriptions.status,
  }))
}

const handler = async (
  req: AuthenticatedNextApiRequest,
  res: NextApiResponse<Data>,
) => {
  const { id } = req.query

  let featureState, subscriptionsState
  try {
    featureState = await getCustomerFeaturesState(req.accountId, id as string)
    subscriptionsState = await getCustomerSubscriptions(
      req.accountId,
      id as string,
    )
  } catch (error) {
    Sentry.captureException(error)
    res.status(400).send('')
    return
  }

  return res.status(200).json({
    subscriptions: subscriptionsState,
    features: featureState,
  })
}

export default middleware(handler)
