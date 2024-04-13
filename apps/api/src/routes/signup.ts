import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { Context } from 'hono'
import { HonoEnv } from '@/lib/hono/env'
import { schema } from '@spackle/db'

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

export default async function (c: Context<HonoEnv>) {
  try {
    const { email } = await c.req.json()

    if (!email) {
      c.status(400)
      return c.json({ error: 'Email is required' })
    }

    const signups = await c
      .get('db')
      .select()
      .from(schema.signups)
      .where(eq(schema.signups.email, email))

    let signup
    if (signups.length === 0) {
      signup = await c
        .get('db')
        .insert(schema.signups)
        .values({ email })
        .returning()
    } else {
      signup = signups[0]
    }

    const res = await fetch('https://api.postmarkapp.com/email', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-Postmark-Server-Token': c.env.POSTMARK_API_KEY,
      },
      body: JSON.stringify({
        From: c.env.POSTMARK_FROM_EMAIL,
        To: email,
        Subject: 'Welcome to Spackle!',
        TextBody: emailText,
        HtmlBody: emailHtml,
      }),
    })

    if (res.status !== 200) {
      throw new Error(
        'Failed to send email: ' + res.status + ' ' + res.statusText,
      )
    }

    await c.get('telemetry').track('Sign up', { email })
    c.status(200)
    return c.json({ success: true })
  } catch (error) {
    c.get('sentry').captureException(error)
    c.status(500)
    return c.json({ error: 'Failed to sign up' })
  }
}
