import type { NextApiRequest, NextApiResponse } from 'next'
import { checkCors } from '@/cors'
import { verifySignature } from '@/stripe/signature'
import supabase from 'spackle-supabase'
import * as Sentry from '@sentry/nextjs'
import { z } from 'zod'

const upsertWaitList = async (email: string, accountId: string) => {
  let response = await supabase.from('wait_list_entries').upsert(
    {
      email,
      stripe_account_id: accountId,
    },
    { onConflict: 'email' },
  )

  if (response.error) {
    throw new Error(response.error.message)
  }

  return response
}

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  await checkCors(req, res)

  const { success } = verifySignature(req)
  if (!success) {
    return res.status(400).send('')
  }

  // Validate inputs
  const { account_id, user_email } = req.body
  const schema = z.object({
    account_id: z.nullable(z.string()),
    user_email: z.string().email({ message: 'Invalid email' }),
  })
  const validation = schema.safeParse({ account_id, user_email })
  if (!validation.success) {
    return res.status(400).json({
      error: validation.error.issues[0].message,
    })
  }

  try {
    await upsertWaitList(user_email, account_id)
  } catch (error) {
    console.error(error)
    Sentry.captureException(error)
    return res.status(400).json({ error })
  }

  res.status(200).json({
    success: true,
  })
}

export default handler
