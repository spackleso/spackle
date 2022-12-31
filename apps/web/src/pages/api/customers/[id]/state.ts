import { NextApiRequest, NextApiResponse } from 'next'
import { getCustomerFeaturesState } from '../../../../state'
import { supabase } from '../../../../supabase'
import * as Sentry from '@sentry/nextjs'
import { withLogging } from '../../../../logger'
import jwt from 'jsonwebtoken'
import { IncomingHttpHeaders } from 'http'

const SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET

type Data = {}

const requestToken = (headers: IncomingHttpHeaders) => {
  if (!SUPABASE_JWT_SECRET) {
    throw new Error('Signing key not set')
  }

  const authorization = headers['authorization'] || 'Bearer '
  const token = authorization.split(' ')[1]
  const payload = jwt.verify(token, SUPABASE_JWT_SECRET)

  if (!payload.sub) {
    throw new Error('Invalid jwt')
  }

  return {
    sub: payload.sub as string,
  }
}

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

const handler = async (req: NextApiRequest, res: NextApiResponse<Data>) => {
  let accountId: string
  try {
    const payload = requestToken(req.headers)
    accountId = payload.sub
  } catch (error) {
    Sentry.captureException(error)
    res.status(403).send('')
    return
  }

  const { id } = req.query

  let featureState, subscriptionsState
  try {
    featureState = await getCustomerFeaturesState(accountId, id as string)
    subscriptionsState = await getCustomerSubscriptions(accountId, id as string)
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

export default withLogging(handler)
