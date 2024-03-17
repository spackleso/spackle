// import type { NextApiRequest, NextApiResponse } from 'next'
// import { verifySignature } from '@/stripe/signature'
// import * as Sentry from '@sentry/nextjs'
// import db, { decodePk, pricingTableProducts, pricingTables } from '@/db'
// import { and, eq, inArray } from 'drizzle-orm'

import { HonoEnv } from '@/lib/hono/env'
import { schema, and, eq, inArray } from '@spackle/db'
import { Context } from 'hono'

type PricingTableUpdateData = {
  name: string
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

const validateConfig = async (data: PricingTableUpdateData) => {
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
  const { account_id, id, ...updateData } = await c.req.json()
  const data = updateData as PricingTableUpdateData

  const result = await c
    .get('db')
    .select()
    .from(schema.pricingTables)
    .where(
      and(
        eq(schema.pricingTables.stripeAccountId, account_id),
        c.get('dbService').decodePk(schema.pricingTables.id, id),
      ),
    )

  if (!result.length) {
    c.status(404)
    return c.json({
      error: 'Not Found',
    })
  }

  const pricingTable = result[0]

  try {
    await validateConfig(data)

    // Update the pricing table
    await c
      .get('db')
      .update(schema.pricingTables)
      .set({
        name: data.name,
        monthlyEnabled: data.monthly_enabled,
        annualEnabled: data.annual_enabled,
      })
      .where(
        and(
          eq(schema.pricingTables.stripeAccountId, account_id),
          eq(schema.pricingTables.id, pricingTable.id),
        ),
      )

    const ptps = data.pricing_table_products

    // Update the pricing table products

    // Delete any that are no longer in the list
    const result = await c
      .get('db')
      .select()
      .from(schema.pricingTableProducts)
      .where(
        and(
          eq(schema.pricingTableProducts.stripeAccountId, account_id),
          eq(schema.pricingTableProducts.pricingTableId, pricingTable.id),
        ),
      )

    const ids = ptps.filter((ptp) => !!ptp.id).map((ptp) => ptp.id)
    const deleted = result.filter((ptp) => !ids.includes(ptp.id))
    if (deleted.length) {
      await c
        .get('db')
        .delete(schema.pricingTableProducts)
        .where(
          inArray(
            schema.pricingTableProducts.id,
            deleted.map((ptp) => ptp.id),
          ),
        )
    }

    // Create any new ones
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

    // Update
    const updatedPricingTableProducts = ptps
      .filter((ptp: any) => ptp.hasOwnProperty('id'))
      .map((ptp: any) => ({
        id: ptp.id,
        stripeAccountId: account_id,
        pricingTableId: pricingTable.id,
        stripeProductId: ptp.product_id,
        monthlyStripePriceId: ptp.monthly_stripe_price_id,
        annualStripePriceId: ptp.annual_stripe_price_id,
      }))

    for (const ptp of updatedPricingTableProducts) {
      await c
        .get('db')
        .update(schema.pricingTableProducts)
        .set(ptp)
        .where(
          and(
            eq(
              schema.pricingTableProducts.stripeAccountId,
              ptp.stripeAccountId,
            ),
            eq(schema.pricingTableProducts.id, ptp.id),
          ),
        )
    }
  } catch (error: any) {
    c.get('sentry').captureException(error)
    c.status(400)
    return c.json({
      error: (error as Error).message,
    })
  }

  return c.json({ success: true })
}
