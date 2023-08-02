import type { NextApiRequest, NextApiResponse } from 'next'
import { verifySignature } from '@/stripe/signature'
import { track } from '@/posthog'
import { upsertStripeUser } from '@/stripe/db'

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { success } = verifySignature(req)
  if (!success) {
    return res.status(403).json({
      error: 'Unauthorized',
    })
  }

  const { account_id, user_id, user_email, user_name, event, properties } =
    req.body

  const user = await upsertStripeUser(
    account_id,
    user_id,
    user_email,
    user_name,
  )

  if (!user) {
    return res.status(400).send('')
  }

  await track(user.id.toString(), event, properties)
  res.status(200).json({})
}

export default handler
