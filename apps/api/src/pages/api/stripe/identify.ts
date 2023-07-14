import type { NextApiRequest, NextApiResponse } from 'next'
import { verifySignature } from '@/stripe/signature'
import { identify } from '@/posthog'
import { upsertStripeUser } from '@/stripe/db'

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { success } = verifySignature(req)
  if (!success) {
    return res.status(400).send('')
  }

  const { account_id, user_id, user_email, user_name, path } = req.body
  const user = await upsertStripeUser(
    account_id,
    user_id,
    user_email,
    user_name,
  )

  if (!user) {
    return res.status(400).send('')
  }

  await identify(
    user.id.toString(),
    {
      name: user.name,
      email: user.email,
      stripe_id: user.stripe_id,
    },
    path,
  )

  res.status(200).json({})
}

export default handler
