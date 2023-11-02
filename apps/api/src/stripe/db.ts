import { track } from '@/posthog'
import db, {
  stripeAccounts,
  stripeCustomers,
  stripeCharges,
  stripeInvoices,
  stripePrices,
  stripeProducts,
  stripeSubscriptionItems,
  stripeSubscriptions,
  stripeUsers,
} from '@/db'
import { and, eq } from 'drizzle-orm'

export const getStripeAccount = async (stripeId: string) => {
  const result = await db
    .select()
    .from(stripeAccounts)
    .where(eq(stripeAccounts.stripeId, stripeId))

  if (result.length) {
    return result[0]
  }

  return null
}

export const upsertStripeAccount = async (
  stripeId: string,
  name: string | undefined | null,
) => {
  let stripeAccount = await getStripeAccount(stripeId)
  let result
  if (stripeAccount) {
    if (name) {
      result = await db
        .update(stripeAccounts)
        .set({ name })
        .where(eq(stripeAccounts.id, stripeAccount.id))
        .returning()
    } else {
      result = [stripeAccount]
    }
  } else {
    result = await db
      .insert(stripeAccounts)
      .values({ stripeId, name, stripeJson: {} })
      .returning()

    await track('group_event', 'New account', {
      $groups: { company: stripeId },
    })
  }
  return result[0]
}

export const getStripeUser = async (
  stripeAccountId: string,
  stripeId: string,
) => {
  const result = await db
    .select()
    .from(stripeUsers)
    .where(
      and(
        eq(stripeUsers.stripeAccountId, stripeAccountId),
        eq(stripeUsers.stripeId, stripeId),
      ),
    )

  if (result.length) {
    return result[0]
  }

  return null
}

export const upsertStripeUser = async (
  stripeAccountId: string,
  stripeId: string,
  email?: string | null,
  name?: string | null,
) => {
  const stripeUser = await getStripeUser(stripeAccountId, stripeId)

  let result
  if (stripeUser) {
    if (email || name) {
      result = await db
        .update(stripeUsers)
        .set({ name, email })
        .where(
          and(
            eq(stripeUsers.stripeAccountId, stripeAccountId),
            eq(stripeUsers.stripeId, stripeId),
          ),
        )
        .returning()
    } else {
      result = [stripeUser]
    }
  } else {
    result = await db
      .insert(stripeUsers)
      .values({ stripeAccountId, stripeId, email, name })
      .returning()

    await track(result[0].id.toString(), 'New user', {
      email: result[0].email,
      name: result[0].name,
      stripe_id: result[0].stripeId,
      $groups: { company: stripeAccountId },
    })
  }
  return result[0]
}

export const getStripeProduct = async (
  stripeAccountId: string,
  stripeId: string,
) => {
  const result = await db
    .select()
    .from(stripeProducts)
    .where(
      and(
        eq(stripeProducts.stripeAccountId, stripeAccountId),
        eq(stripeProducts.stripeId, stripeId),
      ),
    )

  if (result.length) {
    return result[0]
  }

  return null
}

export const upsertStripeProduct = async (
  stripeAccountId: string,
  stripeId: string,
  stripeJson: any,
) => {
  const stripeProduct = await getStripeProduct(stripeAccountId, stripeId)

  let result
  if (stripeProduct) {
    if (stripeJson) {
      result = await db
        .update(stripeProducts)
        .set({ stripeJson })
        .where(
          and(
            eq(stripeProducts.stripeAccountId, stripeAccountId),
            eq(stripeProducts.stripeId, stripeId),
          ),
        )
        .returning()
    } else {
      result = [stripeProduct]
    }
  } else {
    result = await db
      .insert(stripeProducts)
      .values({ stripeAccountId, stripeId, stripeJson })
      .returning()
  }
  return result[0]
}

export const getStripePrice = async (
  stripeAccountId: string,
  stripeId: string,
) => {
  const result = await db
    .select()
    .from(stripePrices)
    .where(
      and(
        eq(stripePrices.stripeAccountId, stripeAccountId),
        eq(stripePrices.stripeId, stripeId),
      ),
    )

  if (result.length) {
    return result[0]
  }

  return null
}

export const upsertStripePrice = async (
  stripeAccountId: string,
  stripeId: string,
  stripeProductId: string,
  stripeJson: any,
) => {
  const stripePrice = await getStripePrice(stripeAccountId, stripeId)

  let result
  if (stripePrice) {
    result = await db
      .update(stripePrices)
      .set({ stripeJson, stripeProductId })
      .where(
        and(
          eq(stripePrices.stripeAccountId, stripeAccountId),
          eq(stripePrices.stripeId, stripeId),
        ),
      )
      .returning()
  } else {
    result = await db
      .insert(stripePrices)
      .values({ stripeAccountId, stripeId, stripeProductId, stripeJson })
      .returning()
  }
  return result[0]
}

export const getStripeCustomer = async (
  stripeAccountId: string,
  stripeId: string,
) => {
  const result = await db
    .select()
    .from(stripeCustomers)
    .where(
      and(
        eq(stripeCustomers.stripeAccountId, stripeAccountId),
        eq(stripeCustomers.stripeId, stripeId),
      ),
    )

  if (result.length) {
    return result[0]
  }

  return null
}

export const upsertStripeCustomer = async (
  stripeAccountId: string,
  stripeId: string,
  stripeJson: any,
) => {
  const stripeCustomer = await getStripeCustomer(stripeAccountId, stripeId)

  let result
  if (stripeCustomer) {
    if (stripeJson) {
      result = await db
        .update(stripeCustomers)
        .set({ stripeJson })
        .where(
          and(
            eq(stripeCustomers.stripeAccountId, stripeAccountId),
            eq(stripeCustomers.stripeId, stripeId),
          ),
        )
        .returning()
    } else {
      result = [stripeCustomer]
    }
  } else {
    result = await db
      .insert(stripeCustomers)
      .values({ stripeAccountId, stripeId, stripeJson })
      .returning()
  }
  return result[0]
}

export const getStripeSubscription = async (
  stripeAccountId: string,
  stripeId: string,
) => {
  const result = await db
    .select()
    .from(stripeSubscriptions)
    .where(
      and(
        eq(stripeSubscriptions.stripeAccountId, stripeAccountId),
        eq(stripeSubscriptions.stripeId, stripeId),
      ),
    )

  if (result.length) {
    return result[0]
  }

  return null
}

export const upsertStripeSubscription = async (
  stripeAccountId: string,
  stripeId: string,
  stripeCustomerId: string,
  status: string,
  stripeJson: any,
) => {
  const stripeSubscription = await getStripeSubscription(
    stripeAccountId,
    stripeId,
  )

  let result
  if (stripeSubscription) {
    result = await db
      .update(stripeSubscriptions)
      .set({ status, stripeJson })
      .where(
        and(
          eq(stripeSubscriptions.stripeAccountId, stripeAccountId),
          eq(stripeSubscriptions.stripeId, stripeId),
        ),
      )
      .returning()
  } else {
    result = await db
      .insert(stripeSubscriptions)
      .values({
        stripeAccountId,
        stripeId,
        stripeCustomerId,
        status,
        stripeJson,
      })
      .returning()
  }
  return result[0]
}

export const deleteStripeSubscription = async (
  stripeAccountId: string,
  stripeId: string,
) => {
  await db
    .delete(stripeSubscriptions)
    .where(
      and(
        eq(stripeSubscriptions.stripeAccountId, stripeAccountId),
        eq(stripeSubscriptions.stripeId, stripeId),
      ),
    )
}

export const getStripeSubscriptionItem = async (
  stripeAccountId: string,
  stripeId: string,
) => {
  const result = await db
    .select()
    .from(stripeSubscriptionItems)
    .where(
      and(
        eq(stripeSubscriptionItems.stripeAccountId, stripeAccountId),
        eq(stripeSubscriptionItems.stripeId, stripeId),
      ),
    )

  if (result.length) {
    return result[0]
  }

  return null
}

export const upsertStripeSubscriptionItem = async (
  stripeAccountId: string,
  stripeId: string,
  stripePriceId: string,
  stripeSubscriptionId: string,
  stripeJson: any,
) => {
  const stripeSubscriptionItem = await getStripeSubscriptionItem(
    stripeAccountId,
    stripeId,
  )

  let result
  if (stripeSubscriptionItem) {
    if (stripeJson) {
      result = await db
        .update(stripeSubscriptionItems)
        .set({ stripeJson })
        .where(
          and(
            eq(stripeSubscriptionItems.stripeAccountId, stripeAccountId),
            eq(stripeSubscriptionItems.stripeId, stripeId),
          ),
        )
        .returning()
    } else {
      result = [stripeSubscriptionItem]
    }
  } else {
    result = await db
      .insert(stripeSubscriptionItems)
      .values({
        stripeAccountId,
        stripeId,
        stripePriceId,
        stripeSubscriptionId,
        stripeJson,
      })
      .returning()
  }
  return result[0]
}

export const getStripeInvoice = async (
  stripeAccountId: string,
  stripeId: string,
) => {
  const result = await db
    .select()
    .from(stripeInvoices)
    .where(
      and(
        eq(stripeInvoices.stripeAccountId, stripeAccountId),
        eq(stripeInvoices.stripeId, stripeId),
      ),
    )

  if (result.length) {
    return result[0]
  }

  return null
}

export const getStripeCharge = async (
  stripeAccountId: string,
  stripeId: string,
) => {
  const result = await db
    .select()
    .from(stripeCharges)
    .where(
      and(
        eq(stripeCharges.stripeAccountId, stripeAccountId),
        eq(stripeCharges.stripeId, stripeId),
      ),
    )

  if (result.length) {
    return result[0]
  }

  return null
}

export const upsertStripeInvoice = async (
  stripeAccountId: string,
  stripeId: string,
  stripeJson: any,
  stripeSubscriptionId: string | null,
) => {
  const stripeInvoice = await getStripeInvoice(stripeAccountId, stripeId)

  let result
  if (stripeInvoice) {
    if (stripeJson) {
      result = await db
        .update(stripeInvoices)
        .set({ stripeJson, stripeSubscriptionId })
        .where(
          and(
            eq(stripeInvoices.stripeAccountId, stripeAccountId),
            eq(stripeInvoices.stripeId, stripeId),
          ),
        )
        .returning()
    } else {
      result = [stripeInvoice]
    }
  } else {
    result = await db
      .insert(stripeInvoices)
      .values({ stripeAccountId, stripeId, stripeJson, stripeSubscriptionId })
      .returning()
  }
  return result[0]
}

export const upsertStripeCharge = async (
  stripeAccountId: string,
  stripeId: string,
  amount: number,
  mode: string,
  status: string,
  stripeCreated: number,
  stripeInvoiceId: string | null,
  stripeJson: any,
) => {
  const stripeCharge = await getStripeCharge(stripeAccountId, stripeId)

  let result
  if (stripeCharge) {
    if (stripeJson) {
      result = await db
        .update(stripeCharges)
        .set({
          amount,
          mode: mode === 'live' ? 0 : 1,
          status,
          stripeCreated: new Date(stripeCreated * 1000).toISOString(),
          stripeInvoiceId,
          stripeJson,
        })
        .where(
          and(
            eq(stripeCharges.stripeAccountId, stripeAccountId),
            eq(stripeCharges.stripeId, stripeId),
          ),
        )
        .returning()
    } else {
      result = [stripeCharge]
    }
  } else {
    result = await db
      .insert(stripeCharges)
      .values({
        stripeAccountId,
        stripeId,
        amount,
        mode: mode === 'live' ? 0 : 1,
        status,
        stripeCreated: new Date(stripeCreated * 1000).toISOString(),
        stripeInvoiceId,
        stripeJson,
      })
      .returning()
  }
  return result[0]
}
