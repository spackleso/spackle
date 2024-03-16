// import type { NextApiRequest, NextApiResponse } from 'next'
// import { verifySignature } from '@/stripe/signature'
// import db, { features, productFeatures } from '@/db'
// import { and, eq } from 'drizzle-orm'

import { HonoEnv } from '@/lib/hono/env'
import { and, eq, schema } from '@spackle/db'
import { Context } from 'hono'

// const handler = async (req: NextApiRequest, res: NextApiResponse) => {
//   const { success } = verifySignature(req)
//   if (!success) {
//     return res.status(403).json({
//       error: 'Unauthorized',
//     })
//   }

//   const { account_id, product_id } = req.body
//   const data = await db
//     .select({
//       id: productFeatures.id,
//       feature_id: productFeatures.featureId,
//       value_flag: productFeatures.valueFlag,
//       value_limit: productFeatures.valueLimit,
//       name: features.name,
//     })
//     .from(productFeatures)
//     .leftJoin(features, eq(productFeatures.featureId, features.id))
//     .where(
//       and(
//         eq(productFeatures.stripeAccountId, account_id),
//         eq(productFeatures.stripeProductId, product_id),
//       ),
//     )
//     .orderBy(features.name)

//   res.status(200).json({ data })
// }

// export default handler

export default async function (c: Context<HonoEnv>) {
  const { account_id, product_id } = await c.req.json()
  const data = await c
    .get('db')
    .select({
      id: schema.productFeatures.id,
      feature_id: schema.productFeatures.featureId,
      value_flag: schema.productFeatures.valueFlag,
      value_limit: schema.productFeatures.valueLimit,
      name: schema.features.name,
    })
    .from(schema.productFeatures)
    .leftJoin(
      schema.features,
      eq(schema.productFeatures.featureId, schema.features.id),
    )
    .where(
      and(
        eq(schema.productFeatures.stripeAccountId, account_id),
        eq(schema.productFeatures.stripeProductId, product_id),
      ),
    )
    .orderBy(schema.features.name)

  return c.json({ data })
}
