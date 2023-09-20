import { NextApiResponse } from 'next'
import { AuthenticatedNextApiRequest, middleware } from '@/api'
import { getProductFeaturesState } from '@/state'
import db, {
  decodePk,
  encodePk,
  pricingTableProducts,
  pricingTables,
  stripePrices,
  stripeProducts,
} from '@/db'
import { and, eq } from 'drizzle-orm'
import Stripe from 'stripe'
import { alias } from 'drizzle-orm/pg-core'

type Success = {
  id: string
  name: string
  intervals: string[]
  products: {
    id: string
    features: {
      id: string
      name: string
      key: string
      type: number
      value_flag: boolean
      value_limit: number | null
    }[]
    name: string
    prices: {
      month?: {
        unit_amount: number
        currency: string
      }
      year?: {
        unit_amount: number
        currency: string
      }
    }
  }[]
}

type Error = {
  error: string
}

const handler = async (
  req: AuthenticatedNextApiRequest,
  res: NextApiResponse<Success | Error>,
) => {
  const { id } = req.query

  const pricingTablesResult = await db
    .select({
      id: pricingTables.id,
      encodedId: encodePk(pricingTables.id),
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

  const products = ptProducts
    .map((ptp) => {
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
        id: ptp.stripeProductId,
        features: states[ptp.stripeProductId],
        name: (ptp.stripeJson as Stripe.Product).name,
        prices,
      }
    })
    .sort((a, b) => {
      if (pricingTable.monthlyEnabled) {
        if (
          a.prices.month &&
          a.prices.month.unit_amount &&
          b.prices.month &&
          b.prices.month.unit_amount
        ) {
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
        if (
          a.prices.year &&
          a.prices.year.unit_amount &&
          b.prices.year &&
          b.prices.year.unit_amount
        ) {
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

  return res.status(200).json({
    id: pricingTable.encodedId as string,
    name: pricingTable.name ?? '',
    intervals,
    products,
  })
}

export default middleware(handler, ['GET'], true)
