import type { NextApiRequest, NextApiResponse } from 'next'
import { withLogging } from '@/logger'
import supabase from 'spackle-supabase'
import * as Sentry from '@sentry/nextjs'
import { z } from 'zod'
import { checkCors } from '@/cors'

const upsertWaitList = async (email: string) => {
  let response = await supabase.from('wait_list_entries').upsert(
    {
      email,
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

  // Validate inputs
  const { user_email } = req.body
  const schema = z.object({
    user_email: z.string().email({ message: 'Invalid email' }),
  })
  const validation = schema.safeParse({ user_email })
  if (!validation.success) {
    return res.status(400).json({
      error: validation.error.issues[0].message,
    })
  }

  try {
    await upsertWaitList(user_email)
  } catch (error) {
    console.error(error)
    Sentry.captureException(error)
    return res.status(400).json({ error })
  }

  res.status(200).json({
    success: true,
  })
}

export default withLogging(handler)
