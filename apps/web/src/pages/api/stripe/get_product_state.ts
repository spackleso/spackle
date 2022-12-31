import type { NextApiRequest, NextApiResponse } from 'next'
import { checkCors } from '../../../cors'
import { withLogging } from '../../../logger'
import { getProductFeaturesState } from '../../../state'
import { verifySignature } from '../../../stripe/signature'

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  await checkCors(req, res)

  const { success } = verifySignature(req)
  if (!success) {
    return res.status(400).send('')
  }

  // TODO: handle all errors
  const { account_id, product_id, mode } = req.body

  const features = await getProductFeaturesState(account_id, product_id)

  res.status(200).json({
    data: features,
  })
}

export default withLogging(handler)