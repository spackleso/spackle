import { NextApiResponse } from 'next'
import { AuthenticatedNextApiRequest, middleware } from '@/api'
import { getProductFeaturesState } from '@/state'
import db, {
  decodePk,
  pricingTableProducts,
  pricingTables,
  stripePrices,
  stripeProducts,
} from 'spackle-db'
import { and, eq, sql } from 'drizzle-orm'
import Stripe from 'stripe'
import { alias } from 'drizzle-orm/pg-core'
import { decode } from 'punycode'

type Data = {}

const handler = async (
  req: AuthenticatedNextApiRequest,
  res: NextApiResponse<Data>,
) => {
  const { id } = req.query

  const pricingTablesResult = await db
    .select({
      id: pricingTables.id,
      name: pricingTables.name,
      monthlyEnabled: pricingTables.monthlyEnabled,
      annualEnabled: pricingTables.annualEnabled,
    })
    .from(pricingTables)
    .where(
      and(
        decodePk(pricingTables.id, id as string),
        eq(pricingTables.stripeAccountId, req.stripeAccountId),
      ),
    )

  if (!pricingTablesResult.length) {
    return res.status(404).json({
      error: 'Not Found',
    })
  }

  const pricingTable = pricingTablesResult[0]
  const monthlyStripePrices = alias(stripePrices, 'monthlyStripePrices')
  const annualStripePrices = alias(stripePrices, 'annualStripePrices')
  const ptProducts = await db
    .select({
      id: pricingTableProducts.id,
      stripeProductId: pricingTableProducts.stripeProductId,
      stripeJson: stripeProducts.stripeJson,
      monthlyStripePrice: monthlyStripePrices.stripeJson,
      annualStripePrice: annualStripePrices.stripeJson,
    })
    .from(pricingTableProducts)
    .leftJoin(
      stripeProducts,
      eq(pricingTableProducts.stripeProductId, stripeProducts.stripeId),
    )
    .leftJoin(
      monthlyStripePrices,
      eq(
        pricingTableProducts.monthlyStripePriceId,
        monthlyStripePrices.stripeId,
      ),
    )
    .leftJoin(
      annualStripePrices,
      eq(pricingTableProducts.annualStripePriceId, annualStripePrices.stripeId),
    )
    .where(
      and(
        eq(pricingTableProducts.stripeAccountId, req.stripeAccountId),
        eq(pricingTableProducts.pricingTableId, pricingTable.id),
      ),
    )
    .orderBy(pricingTableProducts.id)

  const states: any = {}
  for (const ptProduct of ptProducts) {
    states[ptProduct.stripeProductId] = await getProductFeaturesState(
      req.stripeAccountId,
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

  res.status(200).json([
    {
      id: pricingTable.id,
      name: pricingTable.name,
      intervals,
      products: ptProducts.map((ptp) => {
        const prices: any = {}
        if (ptp.monthlyStripePrice) {
          prices.month = {
            unit_amount: (ptp.monthlyStripePrice as Stripe.Price).unit_amount,
            currency: (ptp.monthlyStripePrice as Stripe.Price).currency,
          }
        }
        if (ptp.annualStripePrice) {
          prices.year = {
            unit_amount: (ptp.annualStripePrice as Stripe.Price).unit_amount,
            currency: (ptp.annualStripePrice as Stripe.Price).currency,
          }
        }
        return {
          id: ptp.id,
          features: states[ptp.stripeProductId],
          name: (ptp.stripeJson as any).name,
          prices,
        }
      }),
    },
  ])
}

export default middleware(handler, ['GET'])
