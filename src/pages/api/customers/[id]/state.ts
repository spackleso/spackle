import { NextApiRequest, NextApiResponse } from 'next'
import { getCustomerState } from '../../../../state'
import { supabase } from '../../../../supabase'
import * as Sentry from '@sentry/nextjs'
import { withLogging } from '../../../../logger'
import jwt from 'jsonwebtoken'
import { SIGNING_KEY } from '../../stripe/get_token'
import { IncomingHttpHeaders } from 'http'

type Data = {}

const requestToken = (headers: IncomingHttpHeaders) => {
  if (!SIGNING_KEY) {
    throw new Error('Signing key not set')
  }

  const authorization = headers['authorization'] || 'Basic '
  const token = authorization.split(' ')[1]
  const payload = jwt.verify(token, SIGNING_KEY)

  if (!payload.sub) {
    throw new Error('Invalid jwt')
  }

  return {
    sub: payload.sub as string,
  }
}

const handler = async (req: NextApiRequest, res: NextApiResponse<Data>) => {
  let accountId: string
  try {
    const payload = requestToken(req.headers)
    accountId = payload.sub
  } catch (error) {
    res.status(403).send('')
    return
  }

  const { id } = req.query
  const state = await getCustomerState(accountId, id as string)
  return res.status(200).json({
    data: state,
  })
}

export default withLogging(handler)
