import Cors from 'cors'
import { NextApiRequest, NextApiResponse } from 'next'

const cors = Cors({
  origin: '*',
})

export const runMiddleware = (
  req: NextApiRequest,
  res: NextApiResponse,
  fn: Function,
) => {
  return new Promise((resolve, reject) => {
    fn(req, res, (result: any) => {
      if (result instanceof Error) {
        return reject(result)
      }

      return resolve(result)
    })
  })
}

export const checkCors = async (req: NextApiRequest, res: NextApiResponse) =>
  await runMiddleware(req, res, cors)
