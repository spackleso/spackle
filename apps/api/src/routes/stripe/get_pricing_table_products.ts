import { Context } from 'hono'
import { HonoEnv } from '@/lib/hono/env'
import { alias } from 'drizzle-orm/pg-core'
import { and, eq, schema } from '@spackle/db'
import Stripe from 'stripe'

type PricingTableProductData = {
  id: number
  product_id: string
  name: string
  monthly_stripe_price?: Stripe.Price
  annual_stripe_price?: Stripe.Price
}

export default async function (c: Context<HonoEnv>) {
  const { account_id, pricing_table_id } = await c.req.json()
  const monthlyStripePrices = alias(schema.stripePrices, 'monthlyStripePrices')
  const annualStripePrices = alias(schema.stripePrices, 'annualStripePrices')
  const pricingTableResult = await c
    .get('db')
    .select({
      id: schema.pricingTableProducts.id,
      stripeProductId: schema.pricingTableProducts.stripeProductId,
      stripeProductStripeJson: schema.stripeProducts.stripeJson,
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
        eq(schema.pricingTableProducts.stripeAccountId, account_id),
        c
          .get('dbService')
          .decodePk(
            schema.pricingTableProducts.pricingTableId,
            pricing_table_id,
          ),
      ),
    )

  return c.json(
    pricingTableResult.map((ptp) => ({
      id: ptp.id,
      product_id: ptp.stripeProductId,
      name: (ptp.stripeProductStripeJson as Stripe.Product).name || '',
      monthly_stripe_price: ptp.monthlyStripePrice as Stripe.Price,
      annual_stripe_price: ptp.annualStripePrice as Stripe.Price,
    })) as PricingTableProductData[],
  )
}
