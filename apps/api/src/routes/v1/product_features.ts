import { APIHonoEnv, App } from '@/lib/hono/env'
import { getPagination } from '@/lib/pagination'
import { OpenAPIHono } from '@hono/zod-openapi'
import { schema, eq } from '@spackle/db'
import { Context } from 'hono'
import { z } from 'zod'

const app = new OpenAPIHono() as App

app.use('*', async (c: Context<APIHonoEnv>, next) => {
  if (c.get('token').publishable) {
    c.status(403)
    return c.json({ error: 'Forbidden' })
  }
  return next()
})

const createFlagProductFeatureSchema = z.object({
  feature_id: z.number(),
  stripe_product_id: z.string(),
  value_flag: z.boolean(),
  value_limit: z.null().optional(),
})

const createLimitProductFeatureSchema = z.object({
  feature_id: z.number(),
  stripe_product_id: z.string(),
  value_flag: z.null().optional(),
  value_limit: z.number().nullable(),
})

const createProductFeatureSchema = z.union([
  createFlagProductFeatureSchema,
  createLimitProductFeatureSchema,
])

const productFeatureSchema = z.object({
  created_at: z.string().nullable(),
  feature_id: z.number(),
  id: z.number(),
  stripe_product_id: z.string(),
  value_flag: z.boolean().nullable(),
  value_limit: z.number().nullable(),
})

type ProductFeature = z.infer<typeof productFeatureSchema>

type List = {
  data: ProductFeature[]
  has_more: boolean
}

type FlattenedErrors = z.inferFlattenedErrors<typeof createProductFeatureSchema>

type Error = {
  error: string | FlattenedErrors
}

app.post('/', async (c: Context<APIHonoEnv>) => {
  const validation = createProductFeatureSchema.safeParse(await c.req.json())
  if (!validation.success) {
    c.status(400)
    return c.json({
      error: validation.error.flatten(),
    })
  }

  const result = await c
    .get('db')
    .insert(schema.productFeatures)
    .values({
      stripeAccountId: c.get('token').sub,
      stripeProductId: validation.data.stripe_product_id,
      featureId: validation.data.feature_id,
      valueFlag: validation.data.value_flag,
      valueLimit: validation.data.value_limit,
    })
    .returning()

  const productFeature = result[0]
  c.status(201)
  return c.json({
    created_at: productFeature.createdAt,
    feature_id: productFeature.featureId,
    id: productFeature.id,
    stripe_product_id: productFeature.stripeProductId,
    value_flag: productFeature.valueFlag,
    value_limit: productFeature.valueLimit,
  })
})

app.get('/', async (c: Context<APIHonoEnv>) => {
  const { from, limit } = getPagination(c, 10)
  const result = await c
    .get('db')
    .select({
      created_at: schema.productFeatures.createdAt,
      feature_id: schema.productFeatures.featureId,
      id: schema.productFeatures.id,
      stripe_product_id: schema.productFeatures.stripeProductId,
      value_flag: schema.productFeatures.valueFlag,
      value_limit: schema.productFeatures.valueLimit,
    })
    .from(schema.productFeatures)
    .where(eq(schema.productFeatures.stripeAccountId, c.get('token').sub))
    .orderBy(schema.productFeatures.id)
    .limit(limit)
    .offset(from)

  const hasMore = result.length > 10
  return c.json({
    data: result.slice(0, 10),
    has_more: hasMore,
  })
})

app.all('/*', async (c: Context<APIHonoEnv>) => {
  c.status(405)
  return c.json({ error: 'Method Not Allowed' })
})

export default app
