import { APIHonoEnv } from '@/lib/hono/env'
import { getPagination } from '@/lib/pagination'
import { OpenAPIHono } from '@hono/zod-openapi'
import { schema, eq } from '@spackle/db'
import { Context } from 'hono'
import { z } from 'zod'

const app = new OpenAPIHono()

const createFlagCustomerFeatureSchema = z.object({
  feature_id: z.number(),
  stripe_customer_id: z.string(),
  value_flag: z.boolean().nullable(),
  value_limit: z.null().optional(),
})

const createLimitCustomerFeatureSchema = z.object({
  feature_id: z.number(),
  stripe_customer_id: z.string(),
  value_flag: z.null().optional(),
  value_limit: z.number().nullable(),
})

const createCustomerFeatureSchema = z.union([
  createFlagCustomerFeatureSchema,
  createLimitCustomerFeatureSchema,
])

const customerFeatureSchema = z.object({
  created_at: z.string().nullable(),
  feature_id: z.number(),
  id: z.number(),
  stripe_customer_id: z.string(),
  value_flag: z.boolean().nullable(),
  value_limit: z.number().nullable(),
})

app.use('*', async (c: Context<APIHonoEnv>, next) => {
  if (c.get('token').publishable) {
    c.status(403)
    return c.json({ error: 'Forbidden' })
  }
  return next()
})

app.post('/', async (c: Context<APIHonoEnv>) => {
  const validation = createCustomerFeatureSchema.safeParse(await c.req.json())
  if (!validation.success) {
    c.status(400)
    return c.json({
      error: validation.error.flatten(),
    })
  }

  const result = await c
    .get('db')
    .insert(schema.customerFeatures)
    .values({
      stripeAccountId: c.get('token').sub,
      stripeCustomerId: validation.data.stripe_customer_id,
      featureId: validation.data.feature_id,
      valueFlag: validation.data.value_flag,
      valueLimit: validation.data.value_limit,
    })
    .returning()

  const customerFeature = result[0]
  c.status(201)
  return c.json({
    created_at: customerFeature.createdAt,
    feature_id: customerFeature.featureId,
    id: customerFeature.id,
    stripe_customer_id: customerFeature.stripeCustomerId,
    value_flag: customerFeature.valueFlag,
    value_limit: customerFeature.valueLimit,
  })
})

app.get('/', async (c: Context<APIHonoEnv>) => {
  const { from, limit } = getPagination(c, 10)
  const result = await c
    .get('db')
    .select({
      created_at: schema.customerFeatures.createdAt,
      feature_id: schema.customerFeatures.featureId,
      id: schema.customerFeatures.id,
      stripe_customer_id: schema.customerFeatures.stripeCustomerId,
      value_flag: schema.customerFeatures.valueFlag,
      value_limit: schema.customerFeatures.valueLimit,
    })
    .from(schema.customerFeatures)
    .where(eq(schema.customerFeatures.stripeAccountId, c.get('token').sub))
    .orderBy(schema.customerFeatures.id)
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
