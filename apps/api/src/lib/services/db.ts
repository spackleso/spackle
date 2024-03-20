import { Database, and, eq, schema, sql } from '@spackle/db'
import { TelemetryService } from '@/lib/services/telemetry'
import { PgColumn } from 'drizzle-orm/pg-core'

// TODO: update all `get` methods to use findOne
export class DatabaseService {
  private readonly db: Database
  private readonly telemetry: TelemetryService
  private readonly pkSalt: string

  constructor(db: Database, telemetry: TelemetryService, pkSalt: string) {
    this.db = db
    this.telemetry = telemetry
    this.pkSalt = pkSalt
  }

  encodePk(id: PgColumn<any>) {
    return sql`id_encode(${id}, ${this.pkSalt}, 8)`
  }

  decodePk(field: PgColumn<any>, id: string) {
    return sql`${field} = (id_decode(${id}, ${this.pkSalt}, 8))[1]`
  }

  async getStripeAccount(stripeId: string) {
    const result = await this.db
      .select()
      .from(schema.stripeAccounts)
      .where(eq(schema.stripeAccounts.stripeId, stripeId))

    if (result.length) {
      return result[0]
    }

    return null
  }

  async getStripeAccountByBillingId(billingId: string) {
    const result = await this.db
      .select()
      .from(schema.stripeAccounts)
      .where(eq(schema.stripeAccounts.billingStripeCustomerId, billingId))

    if (result.length) {
      return result[0]
    }

    return null
  }

  async upsertStripeAccount(
    stripeId: string,
    name: string | undefined | null,
    initialSyncComplete?: boolean | undefined,
    initialSyncStartedAt?: string | undefined | null,
  ) {
    let stripeAccount = await this.getStripeAccount(stripeId)
    let result
    if (stripeAccount) {
      if (name) {
        result = await this.db
          .update(schema.stripeAccounts)
          .set({ name, initialSyncStartedAt, initialSyncComplete })
          .where(eq(schema.stripeAccounts.id, stripeAccount.id))
          .returning()
      } else {
        result = [stripeAccount]
      }
    } else {
      result = await this.db
        .insert(schema.stripeAccounts)
        .values({ stripeId, name, stripeJson: {} })
        .returning()

      await this.telemetry.track('group_event', 'New account', {
        $groups: { company: stripeId },
      })
    }
    return result[0]
  }

  async getStripeUser(stripeAccountId: string, stripeId: string) {
    const result = await this.db
      .select()
      .from(schema.stripeUsers)
      .where(
        and(
          eq(schema.stripeUsers.stripeAccountId, stripeAccountId),
          eq(schema.stripeUsers.stripeId, stripeId),
        ),
      )

    if (result.length) {
      return result[0]
    }

    return null
  }

  async upsertStripeUser(
    stripeAccountId: string,
    stripeId: string,
    email?: string | null,
    name?: string | null,
  ) {
    const stripeUser = await this.getStripeUser(stripeAccountId, stripeId)

    let result
    if (stripeUser) {
      if (email || name) {
        result = await this.db
          .update(schema.stripeUsers)
          .set({ name, email })
          .where(
            and(
              eq(schema.stripeUsers.stripeAccountId, stripeAccountId),
              eq(schema.stripeUsers.stripeId, stripeId),
            ),
          )
          .returning()
      } else {
        result = [stripeUser]
      }
    } else {
      result = await this.db
        .insert(schema.stripeUsers)
        .values({ stripeAccountId, stripeId, email, name })
        .returning()

      await this.telemetry.track(result[0].id.toString(), 'New user', {
        email: result[0].email,
        name: result[0].name,
        stripe_id: result[0].stripeId,
        $groups: { company: stripeAccountId },
      })
    }
    return result[0]
  }

  async getStripeProduct(stripeAccountId: string, stripeId: string) {
    const result = await this.db
      .select()
      .from(schema.stripeProducts)
      .where(
        and(
          eq(schema.stripeProducts.stripeAccountId, stripeAccountId),
          eq(schema.stripeProducts.stripeId, stripeId),
        ),
      )

    if (result.length) {
      return result[0]
    }

    return null
  }

  async upsertStripeProduct(
    stripeAccountId: string,
    stripeId: string,
    stripeJson: any,
  ) {
    const stripeProduct = await this.getStripeProduct(stripeAccountId, stripeId)

    let result
    if (stripeProduct) {
      if (stripeJson) {
        result = await this.db
          .update(schema.stripeProducts)
          .set({ stripeJson })
          .where(
            and(
              eq(schema.stripeProducts.stripeAccountId, stripeAccountId),
              eq(schema.stripeProducts.stripeId, stripeId),
            ),
          )
          .returning()
      } else {
        result = [stripeProduct]
      }
    } else {
      result = await this.db
        .insert(schema.stripeProducts)
        .values({ stripeAccountId, stripeId, stripeJson })
        .returning()
    }
    return result[0]
  }

  async getStripePrice(stripeAccountId: string, stripeId: string) {
    const result = await this.db
      .select()
      .from(schema.stripePrices)
      .where(
        and(
          eq(schema.stripePrices.stripeAccountId, stripeAccountId),
          eq(schema.stripePrices.stripeId, stripeId),
        ),
      )

    if (result.length) {
      return result[0]
    }

    return null
  }

  async upsertStripePrice(
    stripeAccountId: string,
    stripeId: string,
    stripeProductId: string,
    stripeJson: any,
  ) {
    const stripePrice = await this.getStripePrice(stripeAccountId, stripeId)

    let result
    if (stripePrice) {
      result = await this.db
        .update(schema.stripePrices)
        .set({ stripeJson, stripeProductId })
        .where(
          and(
            eq(schema.stripePrices.stripeAccountId, stripeAccountId),
            eq(schema.stripePrices.stripeId, stripeId),
          ),
        )
        .returning()
    } else {
      result = await this.db
        .insert(schema.stripePrices)
        .values({ stripeAccountId, stripeId, stripeProductId, stripeJson })
        .returning()
    }
    return result[0]
  }

  async getStripeCustomer(stripeAccountId: string, stripeId: string) {
    const result = await this.db
      .select()
      .from(schema.stripeCustomers)
      .where(
        and(
          eq(schema.stripeCustomers.stripeAccountId, stripeAccountId),
          eq(schema.stripeCustomers.stripeId, stripeId),
        ),
      )

    if (result.length) {
      return result[0]
    }

    return null
  }

  async upsertStripeCustomer(
    stripeAccountId: string,
    stripeId: string,
    stripeJson: any,
  ) {
    const stripeCustomer = await this.getStripeCustomer(
      stripeAccountId,
      stripeId,
    )

    let result
    if (stripeCustomer) {
      if (stripeJson) {
        result = await this.db
          .update(schema.stripeCustomers)
          .set({ stripeJson })
          .where(
            and(
              eq(schema.stripeCustomers.stripeAccountId, stripeAccountId),
              eq(schema.stripeCustomers.stripeId, stripeId),
            ),
          )
          .returning()
      } else {
        result = [stripeCustomer]
      }
    } else {
      result = await this.db
        .insert(schema.stripeCustomers)
        .values({ stripeAccountId, stripeId, stripeJson })
        .returning()
    }
    return result[0]
  }

  async getStripeSubscription(stripeAccountId: string, stripeId: string) {
    const result = await this.db
      .select()
      .from(schema.stripeSubscriptions)
      .where(
        and(
          eq(schema.stripeSubscriptions.stripeAccountId, stripeAccountId),
          eq(schema.stripeSubscriptions.stripeId, stripeId),
        ),
      )

    if (result.length) {
      return result[0]
    }

    return null
  }

  async upsertStripeSubscription(
    stripeAccountId: string,
    stripeId: string,
    stripeCustomerId: string,
    status: string,
    stripeJson: any,
  ) {
    const stripeSubscription = await this.getStripeSubscription(
      stripeAccountId,
      stripeId,
    )

    let result
    if (stripeSubscription) {
      result = await this.db
        .update(schema.stripeSubscriptions)
        .set({ status, stripeJson })
        .where(
          and(
            eq(schema.stripeSubscriptions.stripeAccountId, stripeAccountId),
            eq(schema.stripeSubscriptions.stripeId, stripeId),
          ),
        )
        .returning()
    } else {
      result = await this.db
        .insert(schema.stripeSubscriptions)
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

  async deleteStripeSubscription(stripeAccountId: string, stripeId: string) {
    await this.db
      .delete(schema.stripeSubscriptions)
      .where(
        and(
          eq(schema.stripeSubscriptions.stripeAccountId, stripeAccountId),
          eq(schema.stripeSubscriptions.stripeId, stripeId),
        ),
      )
  }

  async getStripeSubscriptionItem(stripeAccountId: string, stripeId: string) {
    const result = await this.db
      .select()
      .from(schema.stripeSubscriptionItems)
      .where(
        and(
          eq(schema.stripeSubscriptionItems.stripeAccountId, stripeAccountId),
          eq(schema.stripeSubscriptionItems.stripeId, stripeId),
        ),
      )

    if (result.length) {
      return result[0]
    }

    return null
  }

  async upsertStripeSubscriptionItem(
    stripeAccountId: string,
    stripeId: string,
    stripePriceId: string,
    stripeSubscriptionId: string,
    stripeJson: any,
  ) {
    const stripeSubscriptionItem = await this.getStripeSubscriptionItem(
      stripeAccountId,
      stripeId,
    )

    let result
    if (stripeSubscriptionItem) {
      if (stripeJson) {
        result = await this.db
          .update(schema.stripeSubscriptionItems)
          .set({ stripeJson })
          .where(
            and(
              eq(
                schema.stripeSubscriptionItems.stripeAccountId,
                stripeAccountId,
              ),
              eq(schema.stripeSubscriptionItems.stripeId, stripeId),
            ),
          )
          .returning()
      } else {
        result = [stripeSubscriptionItem]
      }
    } else {
      result = await this.db
        .insert(schema.stripeSubscriptionItems)
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

  async getStripeInvoice(stripeAccountId: string, stripeId: string) {
    const result = await this.db
      .select()
      .from(schema.stripeInvoices)
      .where(
        and(
          eq(schema.stripeInvoices.stripeAccountId, stripeAccountId),
          eq(schema.stripeInvoices.stripeId, stripeId),
        ),
      )

    if (result.length) {
      return result[0]
    }

    return null
  }

  async getStripeCharge(stripeAccountId: string, stripeId: string) {
    const result = await this.db
      .select()
      .from(schema.stripeCharges)
      .where(
        and(
          eq(schema.stripeCharges.stripeAccountId, stripeAccountId),
          eq(schema.stripeCharges.stripeId, stripeId),
        ),
      )

    if (result.length) {
      return result[0]
    }

    return null
  }

  async upsertStripeInvoice(
    stripeAccountId: string,
    stripeId: string,
    stripeJson: any,
    stripeSubscriptionId: string | null,
  ) {
    const stripeInvoice = await this.getStripeInvoice(stripeAccountId, stripeId)

    let result
    if (stripeInvoice) {
      if (stripeJson) {
        result = await this.db
          .update(schema.stripeInvoices)
          .set({ stripeJson, stripeSubscriptionId })
          .where(
            and(
              eq(schema.stripeInvoices.stripeAccountId, stripeAccountId),
              eq(schema.stripeInvoices.stripeId, stripeId),
            ),
          )
          .returning()
      } else {
        result = [stripeInvoice]
      }
    } else {
      result = await this.db
        .insert(schema.stripeInvoices)
        .values({ stripeAccountId, stripeId, stripeJson, stripeSubscriptionId })
        .returning()
    }
    return result[0]
  }

  async upsertStripeCharge(
    stripeAccountId: string,
    stripeId: string,
    amount: number,
    mode: string,
    status: string,
    stripeCreated: number,
    stripeInvoiceId: string | null,
    stripeJson: any,
  ) {
    const stripeCharge = await this.getStripeCharge(stripeAccountId, stripeId)

    let result
    if (stripeCharge) {
      if (stripeJson) {
        result = await this.db
          .update(schema.stripeCharges)
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
              eq(schema.stripeCharges.stripeAccountId, stripeAccountId),
              eq(schema.stripeCharges.stripeId, stripeId),
            ),
          )
          .returning()
      } else {
        result = [stripeCharge]
      }
    } else {
      result = await this.db
        .insert(schema.stripeCharges)
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
}
