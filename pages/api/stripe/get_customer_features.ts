import type { NextApiRequest, NextApiResponse } from 'next'
import Cors from 'cors'
import stripe from '../../../stripe'

const customerFeatures = [
  {
    id: 1,
    key: 'prediction_filters',
    name: 'Prediction Filters',
    type: 0,
    value_flag: false,
  },
  {
    id: 2,
    key: 'training',
    name: 'Training Plans',
    type: 0,
    value_flag: false,
  },
  {
    id: 3,
    key: 'activities',
    name: 'Number of Activities',
    type: 1,
    value_limit: 100,
  },
]

type Data = {
  data: any[]
}

const cors = Cors({
  origin: '*',
})

function runMiddleware(
  req: NextApiRequest,
  res: NextApiResponse,
  fn: Function,
) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result: any) => {
      if (result instanceof Error) {
        return reject(result)
      }

      return resolve(result)
    })
  })
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>,
) {
  await runMiddleware(req, res, cors)

  const sig = req.headers['stripe-signature'] as string
  const payload = JSON.stringify(req.body)

  try {
    stripe.webhooks.signature.verifyHeader(
      payload,
      sig,
      process.env.STRIPE_SIGNING_SECRET as string,
    )
  } catch (error: any) {
    res.status(400).send(error.message)
    return
  }

  res.status(200).json({
    data: customerFeatures,
  })
}
