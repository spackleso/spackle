import { APIHonoEnv, App } from '@/lib/hono/env'
import { getPagination } from '@/lib/pagination'
import { OpenAPIHono } from '@hono/zod-openapi'
import { and, eq, schema } from '@spackle/db'
import { Context } from 'hono'
import { z } from 'zod'

const app = new OpenAPIHono() as App

export enum FeatureType {
  Flag = 0,
  Limit = 1,
}

app.use('*', async (c: Context<APIHonoEnv>, next) => {
  if (c.get('token').publishable) {
    c.status(403)
    return c.json({ error: 'Forbidden' })
  }
  return next()
})

const createFeatureSchema = z.discriminatedUnion('type', [
  z.object({
    name: z.string(),
    key: z.string(),
    type: z.literal(FeatureType.Flag),
    value_flag: z.boolean().nullable(),
    value_limit: z.null().optional(),
  }),
  z.object({
    name: z.string(),
    key: z.string(),
    type: z.literal(FeatureType.Limit),
    value_flag: z.null().optional(),
    value_limit: z.number().nullable(),
  }),
])

const featureSchema = z.object({
  created_at: z.string().nullable(),
  id: z.number(),
  key: z.string(),
  name: z.string(),
  type: z.nativeEnum(FeatureType),
  value_flag: z.boolean().nullable(),
  value_limit: z.number().nullable(),
})

type Feature = z.infer<typeof featureSchema>

type List = {
  data: Feature[]
  has_more: boolean
}

type FlattenedErrors = z.inferFlattenedErrors<typeof createFeatureSchema>

type Error = {
  error: string | FlattenedErrors
}

app.post('/', async (c: Context<APIHonoEnv>) => {
  const validation = createFeatureSchema.safeParse(await c.req.json())
  if (!validation.success) {
    c.status(400)
    return c.json({
      error: validation.error.flatten(),
    })
  }

  const result = await c
    .get('db')
    .insert(schema.features)
    .values({
      stripeAccountId: c.get('token').sub,
      key: validation.data.key,
      name: validation.data.name,
      type: validation.data.type,
      valueFlag: validation.data.value_flag,
      valueLimit: validation.data.value_limit,
    })
    .returning()

  const feature = result[0]
  c.status(201)
  return c.json({
    created_at: feature.createdAt,
    id: feature.id,
    key: feature.key,
    name: feature.name,
    type: feature.type,
    value_flag: feature.valueFlag,
    value_limit: feature.valueLimit,
  })
})

app.get('/', async (c: Context<APIHonoEnv>) => {
  const { from, limit } = getPagination(c, 10)
  const result = await c
    .get('db')
    .select({
      created_at: schema.features.createdAt,
      id: schema.features.id,
      key: schema.features.key,
      name: schema.features.name,
      type: schema.features.type,
      value_flag: schema.features.valueFlag,
      value_limit: schema.features.valueLimit,
    })
    .from(schema.features)
    .where(eq(schema.features.stripeAccountId, c.get('token').sub))
    .orderBy(schema.features.id)
    .limit(limit)
    .offset(from)

  const hasMore = result.length > 10

  return c.json({
    data: result.slice(0, 10),
    has_more: hasMore,
  })
})

app.get('/:id', async (c: Context<APIHonoEnv>) => {
  const id = c.req.param('id')

  if (!id) {
    c.status(404)
    return c.json({ error: 'Not found' })
  }

  const primaryKey = parseInt(id as string)
  const result = await c
    .get('db')
    .select({
      created_at: schema.features.createdAt,
      id: schema.features.id,
      key: schema.features.key,
      name: schema.features.name,
      type: schema.features.type,
      value_flag: schema.features.valueFlag,
      value_limit: schema.features.valueLimit,
    })
    .from(schema.features)
    .where(
      and(
        eq(schema.features.stripeAccountId, c.get('token').sub),
        eq(schema.features[primaryKey ? 'id' : 'key'], primaryKey || id),
      ),
    )

  if (!result.length) {
    c.status(404)
    return c.json({ error: 'Not found' })
  }

  const feature = result[0]
  return c.json(feature)
})

app.all('/*', async (c: Context<APIHonoEnv>) => {
  c.status(405)
  return c.json({ error: 'Method Not Allowed' })
})

export default app
