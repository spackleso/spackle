import { HonoEnv } from '@/lib/hono/env'
import { schema } from '@spackle/db'
import { Context } from 'hono'

type PricingTableCreateData = {
  name: string
  mode: number
  pricing_table_id: number
  monthly_enabled: boolean
  annual_enabled: boolean
  pricing_table_products: {
    id?: number
    product_id: string
    monthly_stripe_price_id: string | null
    annual_stripe_price_id: string | null
  }[]
}

// TODO: validate with zod
const validateConfig = async (data: PricingTableCreateData) => {
  if (data.monthly_enabled) {
    if (
      !data.pricing_table_products.every((ptp) => !!ptp.monthly_stripe_price_id)
    ) {
      throw new Error('All products must have a monthly price')
    }
  }

  if (data.annual_enabled) {
    if (
      !data.pricing_table_products.every((ptp) => !!ptp.annual_stripe_price_id)
    ) {
      throw new Error('All products must have an annual price')
    }
  }
}

export default async function (c: Context<HonoEnv>) {
  const { account_id, ...data } = await c.req.json()
  try {
    await validateConfig(data)

    // Update the pricing table
    const pricingTable = (
      await c
        .get('db')
        .insert(schema.pricingTables)
        .values({
          stripeAccountId: account_id,
          mode: data.mode,
          name: data.name,
          monthlyEnabled: data.monthly_enabled,
          annualEnabled: data.annual_enabled,
        })
        .returning()
    )[0]

    const ptps = data.pricing_table_products

    // Create pricing table products
    const newPricingTableProducts = ptps
      .filter((ptp: any) => !ptp.hasOwnProperty('id'))
      .map((ptp: any) => ({
        stripeAccountId: account_id,
        pricingTableId: pricingTable.id,
        stripeProductId: ptp.product_id,
        monthlyStripePriceId: ptp.monthly_stripe_price_id,
        annualStripePriceId: ptp.annual_stripe_price_id,
      }))

    if (newPricingTableProducts.length) {
      await c
        .get('db')
        .insert(schema.pricingTableProducts)
        .values(newPricingTableProducts)
    }
  } catch (error: any) {
    c.get('sentry').captureException(error)
    c.status(400)
    return c.json({
      error: (error as Error).message,
    })
  }

  c.status(201)
  return c.json({
    success: true,
  })
}
