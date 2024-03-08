import { NextApiRequest, NextApiResponse } from 'next'
import db, { Signup, signups } from '@/db'
import { z } from 'zod'
import { eq } from 'drizzle-orm'
import * as postmark from 'postmark'

const formSchema = z.object({
  email: z.string().email(),
})

const getOrCreateSignup = async (email: string) => {
  const select = await db.select().from(signups).where(eq(signups.email, email))

  let signup: Signup
  if (select.length > 0) {
    signup = select[0]
  } else {
    signup = (await db
      .insert(signups)
      .values({ email })
      .returning()) as unknown as Signup
  }
  return signup
}

const emailText = `
Welcome to Spackle!

Spackle makes it easy to build and manage your Stripe integration. We're excited to have you on board!

To get started, install Spackle from the Stripe app marketplace: https://marketplace.stripe.com/apps/spackle

Then, follow the quick start guide in our documentation to get up to speed: https://docs.spackle.so/getting-started

If you have any questions, please respond to this email!

Thanks,
Hunter @ Spackle
`

const emailHtml = `
<html>
  <body>
    <p>Welcome to Spackle!</p>
    <p>Spackle makes it easy to build and manage your Stripe integration. We're excited to have you on board!</p>
    <p>To get started, install Spackle from the Stripe app marketplace: <a href="https://marketplace.stripe.com/apps/spackle">https://marketplace.stripe.com/apps/spackle</a></p>
    <p>Then, follow the quick start guide in our documentation to get up to speed: <a href="https://docs.spackle.so/getting-started">https://docs.spackle.so/getting-started</a></p>
    <p>If you have any questions, please respond to this email!</p>
    <p>Thanks,</p>
    <p>Hunter @ Spackle</p>
  </body>
</html>
`

const sendSignupEmail = async (email: string) => {
  const client = new postmark.ServerClient(process.env.POSTMARK_API_KEY || '')
  await client.sendEmail({
    From: 'hunter@spackle.so',
    To: email,
    Subject: 'Welcome to Spackle!',
    TextBody: emailText,
    HtmlBody: emailHtml,
  })
  // TODO: posthog identify and track event
}

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  let signup
  try {
    const { email } = formSchema.parse(req.body)
    signup = await getOrCreateSignup(email)
    await sendSignupEmail(signup.email)
    res.redirect(301, 'https://www.spackle.so/signed-up')
  } catch (error) {
    console.error(error)
    res.redirect(301, 'https://www.spackle.so/signup?error=true')
  }
}

export default handler
