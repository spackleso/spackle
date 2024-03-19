import { APIHonoEnv } from '@/lib/hono/env'
import { OpenAPIHono } from '@hono/zod-openapi'
import { schema, eq, and } from '@spackle/db'
import { alias } from 'drizzle-orm/pg-core'
import { Context } from 'hono'
import Stripe from 'stripe'

const app = new OpenAPIHono()

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

app.get('/:id', async (c: Context<APIHonoEnv>) => {
  const id = c.req.param('id')

  const pricingTablesResult = await c
    .get('db')
    .select({
      id: schema.pricingTables.id,
      encodedId: c.get('dbService').encodePk(schema.pricingTables.id),
      name: schema.pricingTables.name,
      monthlyEnabled: schema.pricingTables.monthlyEnabled,
      annualEnabled: schema.pricingTables.annualEnabled,
    })
    .from(schema.pricingTables)
    .where(
      and(
        c.get('dbService').decodePk(schema.pricingTables.id, id as string),
        eq(schema.pricingTables.stripeAccountId, c.get('token').sub),
      ),
    )

  if (!pricingTablesResult.length) {
    c.status(404)
    return c.json({
      error: 'Not Found',
    })
  }

  const pricingTable = pricingTablesResult[0]
  const monthlyStripePrices = alias(schema.stripePrices, 'monthlyStripePrices')
  const annualStripePrices = alias(schema.stripePrices, 'annualStripePrices')

  const ptProducts = await c
    .get('db')
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
        eq(schema.pricingTableProducts.stripeAccountId, c.get('token').sub),
        eq(schema.pricingTableProducts.pricingTableId, pricingTable.id),
      ),
    )
    .orderBy(schema.pricingTableProducts.id)

  const states: any = {}
  for (const ptProduct of ptProducts) {
    states[ptProduct.stripeProductId] = await c
      .get('entitlementsService')
      .getProductFeaturesState(c.get('token').sub, ptProduct.stripeProductId)
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

  return c.json({
    id: pricingTable.encodedId as string,
    name: pricingTable.name ?? '',
    intervals,
    products,
  })
})

app.all('/*', async (c: Context<APIHonoEnv>) => {
  c.status(405)
  return c.json({ error: 'Method Not Allowed' })
})

export default app
