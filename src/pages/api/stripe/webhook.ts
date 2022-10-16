import type { NextApiRequest, NextApiResponse } from 'next'

type Data = {
  success: boolean
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>,
) {
  console.log(req.body)
  res.status(200).json({
    success: true,
  })
}
