import db, { stripeAccounts } from '@/db'
import { isNotNull, and } from 'drizzle-orm'
import { getMTR } from '@/billing'

async function main() {
  const accounts = await db
    .select()
    .from(stripeAccounts)
    .where(and(isNotNull(stripeAccounts.billingStripeCustomerId)))

  for (const account of accounts) {
    try {
      const { mtr, freeTierDollars, grossUsageDollars, netUsageDollars } =
        await getMTR(account.stripeId)

      console.log(
        `Account ${account.stripeId} (${account.name}) has used $${grossUsageDollars} with a free tier of $${freeTierDollars}, net $${netUsageDollars}. MTR: ${mtr}`,
      )
    } catch (error) {}
  }

  process.exit(0)
}

main()
