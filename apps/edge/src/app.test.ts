import request from 'supertest'
import jwt from 'jsonwebtoken'

import app from './app'
import * as dynamodb from './dynamodb'

jest.mock('./dynamodb')

const { SUPABASE_JWT_SECRET } = process.env

const generateToken = (accountId: string): string => {
  return jwt.sign(
    {
      sub: accountId,
      iat: Math.floor(Date.now() / 1000),
    },
    SUPABASE_JWT_SECRET ?? '',
  )
}

beforeEach(() => {
  ;(dynamodb.getCustomerState as jest.Mock).mockReset()
})

describe('Home route', () => {
  test('returns 200 status code', async () => {
    const res = await request(app).get('/')
    expect(res.statusCode).toEqual(200)
    expect(res.text).toEqual('')
  })
})

describe('Customer state route', () => {
  test('returns 401 without authentication token', async () => {
    const res = await request(app).get('/customers/1/state')
    expect(res.statusCode).toEqual(401)
    expect(res.text).toEqual('')
  })

  test('returns 200 with customer state', async () => {
    ;(dynamodb.getCustomerState as jest.Mock).mockResolvedValue(
      JSON.stringify({ foo: 'bar' }),
    )
    const res = await request(app)
      .get('/customers/1/state')
      .set({
        Authorization: `Bearer ${generateToken('acct_1234')}`,
      })

    expect(res.statusCode).toEqual(200)
    expect(res.text).toEqual('{"foo":"bar"}')
  })

  test('returns 404 if customer not found', async () => {
    ;(dynamodb.getCustomerState as jest.Mock).mockResolvedValue(undefined)
    const res = await request(app)
      .get('/customers/1/state')
      .set({
        Authorization: `Bearer ${generateToken('acct_1234')}`,
      })

    expect(res.statusCode).toEqual(404)
  })
})
