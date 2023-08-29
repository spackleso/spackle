import type { NextApiRequest, NextApiResponse } from 'next'
import { verifySignature } from '@/stripe/signature'
import * as Sentry from '@sentry/nextjs'
import db, { pricingTableProducts, pricingTables } from 'spackle-db'
import { and, eq, inArray } from 'drizzle-orm'

type PricingTableUpdateData = {
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

const updatePricingTable = async (
  stripeAccountId: string,
  pricingTableId: number,
  data: PricingTableUpdateData,
) => {
  await db.transaction(async (trx) => {
    // Update the pricing table
    await trx
      .update(pricingTables)
      .set({
        monthlyEnabled: data.monthly_enabled,
        annualEnabled: data.annual_enabled,
      })
      .where(
        and(
          eq(pricingTables.stripeAccountId, stripeAccountId),
          eq(pricingTables.id, pricingTableId),
        ),
      )

    const ptps = data.pricing_table_products

    // Update the pricing table products

    // Delete
    const result = await trx
      .select()
      .from(pricingTableProducts)
      .where(
        and(
          eq(pricingTableProducts.stripeAccountId, stripeAccountId),
          eq(pricingTableProducts.pricingTableId, pricingTableId),
        ),
      )

    const ids = ptps.filter((ptp) => !!ptp.id).map((ptp) => ptp.id)
    const deleted = result.filter((ptp) => !ids.includes(ptp.id))
    if (deleted.length) {
      await trx.delete(pricingTableProducts).where(
        inArray(
          pricingTableProducts.id,
          deleted.map((ptp) => ptp.id),
        ),
      )
    }

    // Create
    const newPricingTableProducts = ptps
      .filter((ptp: any) => !ptp.hasOwnProperty('id'))
      .map((ptp: any) => ({
        stripeAccountId,
        pricingTableId,
        stripeProductId: ptp.product_id,
        monthlyStripePriceId: ptp.monthly_stripe_price_id,
        annualStripePriceId: ptp.annual_stripe_price_id,
      }))

    if (newPricingTableProducts.length) {
      await trx.insert(pricingTableProducts).values(newPricingTableProducts)
    }
  })

  // // Update
  // const updatedProductFeatures = data
  //   .filter((pf: any) => pf.hasOwnProperty('id'))
  //   .map((pf: any) => ({
  //     featureId: pf.feature_id,
  //     id: pf.id,
  //     stripeAccountId,
  //     stripeProductId,
  //     valueFlag: pf.value_flag,
  //     valueLimit: pf.value_limit,
  //   }))

  // for (const pf of updatedProductFeatures) {
  //   await db
  //     .update(productFeatures)
  //     .set(pf)
  //     .where(
  //       and(
  //         eq(productFeatures.stripeAccountId, pf.stripeAccountId),
  //         eq(productFeatures.id, pf.id),
  //       ),
  //     )
  // }
}

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { success } = verifySignature(req)
  if (!success) {
    return res.status(403).json({
      error: 'Unauthorized',
    })
  }

  const { account_id, id, ...data } = req.body
  try {
    await updatePricingTable(account_id, id, data)
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
