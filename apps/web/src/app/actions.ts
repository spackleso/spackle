'use server'

import Spackle from 'spackle-node'

export async function getPricingTable() {
  const spackle = new Spackle(process.env.SPACKLE_API_KEY ?? '')
  return await spackle.pricingTables.retrieve(
    process.env.SPACKLE_PRICING_TABLE_ID ?? '',
  )
}
