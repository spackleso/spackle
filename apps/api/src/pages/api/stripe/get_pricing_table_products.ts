import type { NextApiRequest, NextApiResponse } from 'next'
import { verifySignature } from '@/stripe/signature'
import db, {
  pricingTableProducts,
  stripePrices,
  stripeProducts,
} from 'spackle-db'
import { and, eq } from 'drizzle-orm'
import { getProductFeaturesState } from '@/state'
import Stripe from 'stripe'
import { alias } from 'drizzle-orm/pg-core'

enum FeatureType {
  Flag = 0,
  Limit = 1,
}

type Feature = {
  id: number
  key: string
  name: string
  type: FeatureType
  value_flag: boolean | null
  value_limit: number | null
}

type PricingTableProductData = {
  id: number
  name: string
  features: Feature[]
  monthly_stripe_price?: Stripe.Price
  annual_stripe_price?: Stripe.Price
}

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { success } = verifySignature(req)
  if (!success) {
    return res.status(403).json({
      error: 'Unauthorized',
    })
  }

  const { account_id, pricing_table_id } = req.body
  const monthlyStripePrices = alias(stripePrices, 'monthlyStripePrices')
  const annualStripePrices = alias(stripePrices, 'annualStripePrices')
  const pricingTableResult = await db
    .select({
      id: pricingTableProducts.id,
      stripeProductId: pricingTableProducts.stripeProductId,
      stripeProductStripeJson: stripeProducts.stripeJson,
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
        eq(pricingTableProducts.stripeAccountId, account_id),
        eq(pricingTableProducts.pricingTableId, pricing_table_id),
      ),
    )

  const data: PricingTableProductData[] = []

  // TODO: Promise.all the state call
  for (const pricingTableProduct of pricingTableResult) {
    data.push({
      id: pricingTableProduct.id,
      name:
        (pricingTableProduct.stripeProductStripeJson as Stripe.Product)?.name ||
        '',
      features: await getProductFeaturesState(
        account_id,
        pricingTableProduct.stripeProductId,
      ),
      monthly_stripe_price:
        pricingTableProduct.monthlyStripePrice as Stripe.Price,
      annual_stripe_price:
        pricingTableProduct.annualStripePrice as Stripe.Price,
    })
  }
  return res.status(200).json(data)
}

export default handler
