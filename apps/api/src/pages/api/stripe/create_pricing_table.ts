import type { NextApiRequest, NextApiResponse } from 'next'
import { verifySignature } from '@/stripe/signature'
import * as Sentry from '@sentry/nextjs'
import db, { decodePk, pricingTableProducts, pricingTables } from '@/db'
import { and, eq, inArray } from 'drizzle-orm'

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

const createPricingTable = async (
  stripeAccountId: string,
  data: PricingTableCreateData,
) => {
  await validateConfig(data)

  // Update the pricing table
  const pricingTable = (
    await db
      .insert(pricingTables)
      .values({
        stripeAccountId,
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
      stripeAccountId,
      pricingTableId: pricingTable.id,
      stripeProductId: ptp.product_id,
      monthlyStripePriceId: ptp.monthly_stripe_price_id,
      annualStripePriceId: ptp.annual_stripe_price_id,
    }))

  if (newPricingTableProducts.length) {
    await db.insert(pricingTableProducts).values(newPricingTableProducts)
  }
}

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { success } = verifySignature(req)
  if (!success) {
    return res.status(403).json({
      error: 'Unauthorized',
    })
  }

  const { account_id, ...data } = req.body

  try {
    await createPricingTable(account_id, data)
  } catch (error: any) {
    Sentry.captureException(error)
    return res.status(400).json({
      error: (error as Error).message,
    })
  }

  res.status(200).json({
    success: true,
  })
}

export default handler
