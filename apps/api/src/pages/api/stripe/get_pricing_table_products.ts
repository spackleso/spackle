import type { NextApiRequest, NextApiResponse } from 'next'
import { verifySignature } from '@/stripe/signature'
import db, {
  decodePk,
  pricingTableProducts,
  stripePrices,
  stripeProducts,
} from 'spackle-db'
import { and, eq } from 'drizzle-orm'
import Stripe from 'stripe'
import { alias } from 'drizzle-orm/pg-core'

type PricingTableProductData = {
  id: number
  product_id: string
  name: string
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
        decodePk(pricingTableProducts.pricingTableId, pricing_table_id),
      ),
    )

  return res.status(200).json(
    pricingTableResult.map((ptp) => ({
      id: ptp.id,
      product_id: ptp.stripeProductId,
      name: (ptp.stripeProductStripeJson as Stripe.Product).name || '',
      monthly_stripe_price: ptp.monthlyStripePrice as Stripe.Price,
      annual_stripe_price: ptp.annualStripePrice as Stripe.Price,
    })) as PricingTableProductData[],
  )
}

export default handler
