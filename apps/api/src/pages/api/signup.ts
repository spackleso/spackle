import { NextApiRequest, NextApiResponse } from 'next'

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  console.log(req.body)
  res.redirect(301, 'https://www.spackle.so/signed-up')
}

export default handler
