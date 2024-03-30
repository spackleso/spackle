import Stripe from 'stripe'
import { Database, and, eq, schema } from '@spackle/db'
import { DatabaseService } from '@/lib/services/db'
import { EntitlementsService } from '@/lib/services/entitlements'
import { alias } from 'drizzle-orm/pg-core'

export class PricingTablesService {
  private readonly db: Database
  private readonly dbService: DatabaseService
  private readonly entitlementsService: EntitlementsService

  constructor(
    db: Database,
    dbService: DatabaseService,
    entitlementsService: EntitlementsService,
  ) {
    this.db = db
    this.dbService = dbService
    this.entitlementsService = entitlementsService
  }

  async getPricingTableState(stripeAccountId: string, pricingTableId: string) {
    const pricingTablesResult = await this.db
      .select({
        id: schema.pricingTables.id,
        encodedId: this.dbService.encodePk(schema.pricingTables.id),
        name: schema.pricingTables.name,
        monthlyEnabled: schema.pricingTables.monthlyEnabled,
        annualEnabled: schema.pricingTables.annualEnabled,
      })
      .from(schema.pricingTables)
      .where(
        and(
          this.dbService.decodePk(schema.pricingTables.id, pricingTableId),
          eq(schema.pricingTables.stripeAccountId, stripeAccountId),
        ),
      )

    if (!pricingTablesResult.length) {
      throw new Error('Not Found')
    }

    const pricingTable = pricingTablesResult[0]
    const monthlyStripePrices = alias(
      schema.stripePrices,
      'monthlyStripePrices',
    )
    const annualStripePrices = alias(schema.stripePrices, 'annualStripePrices')

    const ptProducts = await this.db
      .select({
        id: schema.pricingTableProducts.id,
        stripeProductId: schema.pricingTableProducts.stripeProductId,
        stripeJson: schema.stripeProducts.stripeJson,
        monthlyStripePrice: monthlyStripePrices.stripeJson,
        annualStripePrice: annualStripePrices.stripeJson,
      })
      .from(schema.pricingTableProducts)
      .leftJoin(
        schema.stripeProducts,
        eq(
          schema.pricingTableProducts.stripeProductId,
          schema.stripeProducts.stripeId,
        ),
      )
      .leftJoin(
        monthlyStripePrices,
        eq(
          schema.pricingTableProducts.monthlyStripePriceId,
          monthlyStripePrices.stripeId,
        ),
      )
      .leftJoin(
        annualStripePrices,
        eq(
          schema.pricingTableProducts.annualStripePriceId,
          annualStripePrices.stripeId,
        ),
      )
      .where(
        and(
          eq(schema.pricingTableProducts.stripeAccountId, stripeAccountId),
          eq(schema.pricingTableProducts.pricingTableId, pricingTable.id),
        ),
      )
      .orderBy(schema.pricingTableProducts.id)

    const states: any = {}
    for (const ptProduct of ptProducts) {
      states[ptProduct.stripeProductId] =
        await this.entitlementsService.getProductFeaturesState(
          stripeAccountId,
          ptProduct.stripeProductId,
        )
    }

    const intervals = []
    if (pricingTable.monthlyEnabled) {
      intervals.push('month')
    }
    if (pricingTable.annualEnabled) {
      intervals.push('year')
    }

    const products = ptProducts
      .map((ptp) => {
        const prices: any = {}
        if (ptp.monthlyStripePrice) {
          prices.month = {
            id: (ptp.monthlyStripePrice as Stripe.Price).id,
            unit_amount: (ptp.monthlyStripePrice as Stripe.Price).unit_amount,
            currency: (ptp.monthlyStripePrice as Stripe.Price).currency,
          }
        }
        if (ptp.annualStripePrice) {
          prices.year = {
            id: (ptp.annualStripePrice as Stripe.Price).id,
            unit_amount: (ptp.annualStripePrice as Stripe.Price).unit_amount,
            currency: (ptp.annualStripePrice as Stripe.Price).currency,
          }
        }
        return {
          id: ptp.stripeProductId,
          features: states[ptp.stripeProductId],
          name: (ptp.stripeJson as Stripe.Product).name,
          description: (ptp.stripeJson as Stripe.Product).description,
          prices,
        }
      })
      .sort((a, b) => {
        if (pricingTable.monthlyEnabled) {
          if (a.prices.month && b.prices.month) {
            return (
              (a.prices.month.unit_amount as number) -
              (b.prices.month.unit_amount as number)
            )
          } else if (a.prices.month) {
            return -1
          } else if (b.prices.month) {
            return 1
          }
        } else if (pricingTable.annualEnabled) {
          if (a.prices.year && b.prices.year) {
            return (
              (a.prices.year.unit_amount as number) -
              (b.prices.year.unit_amount as number)
            )
          } else if (a.prices.year) {
            return -1
          } else if (b.prices.year) {
            return 1
          }
        }
        return 0
      })

    return {
      id: pricingTable.encodedId as string,
      name: pricingTable.name ?? '',
      intervals,
      products,
    }
  }
}
