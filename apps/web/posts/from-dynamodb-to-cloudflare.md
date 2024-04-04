---
title: "From DynamoDB to CloudFlare - Spackle’s New Edge Architecture"
excerpt: "The Spackle codebase has been through a lot of changes recently. Most notably, it’s now open source. But if you take a peak at the commit log, you’ll notice a major overhaul of the internal structure of Spackle."
isPublished: true
publishedDate: "2024-04-04"
updatedDate: "2024-04-04"
---
The Spackle codebase has been through a lot of changes recently. Most notably, it’s now [open source](https://github.com/spackleso/spackle). But if you take a peak at the commit log, you’ll notice a major overhaul of the internal structure of Spackle.

## In The Beginning

Spackle began a couple years ago as an attempt to tame the billing complexity found in B2B SaaS applications. There were two basic insights:

1. All applications should use [entitlements](https://www.spackle.so/posts/saas-entitlements-the-basics) for billing authorization. This is the primary feature of Spackle.
2. Data can be pushed to the edge to side step webhooks. This is the method of delivery for entitlements.

When the project first began, there were two codebases: one for all web related code (api endpoints, documentation, marketing site) and one for the Stripe app itself. [The Stripe app codebase](https://github.com/spackleso/spackle-stripe) is still self-contained and is a topic for another time. This post primarily focuses on the former.

In order to deliver the above insights, the Spackle application centralized around two collections of business logic.

1. An API responsible for syncing Stripe data and handling webhooks for all customers.
2. Infrastructure to support an ideal developer experience without webhooks.

The API was initially written in Next.js using the pages router and deployed on Vercel. What started as a handful of endpoints pretty quickly ended up as a fairly large API surface area as all of the functions of the Stripe App were built out.

The second piece of the puzzle was the infrastructure. Looked at as a black box, the API could be thought of as taking Stripe data and entitlements, and pushing data out to the edge so that client applications could retrieve it.

The edge storage mechanism was initially implemented in DynamoDB and managed by Terraform. In every supported region, a DynamoDB replica was set up to facilitate entitlement storage. As new data was received from Stripe, it was transformed into the entitlement it impacted and pushed out to all regions near our customers’ applications.

While this system worked fine, there were a couple of drawbacks:

1. It started to feel a bit strange to have such a large API live within a React framework
2. There were effectively two api domains for a single API: [edge.spackle.so](http://edge.spackle.so) and [api.spackle.so](http://api.spackle.so) which added some developer confusion
3. Supported regions needed to be manually created as needed
4. Every region carried with it fixed cost regardless of usage
5. Entitlement latency was capped at ~70ms because of the infrastructure stack

So in early 2024 it was time to rethink some of these foundational decisions.

## (Re-)Discovering CloudFlare

CloudFlare and their Workers product has been on my radar for a couple of years now. It’s a serverless product that is opinionated. And for whatever reason, a combination of the CloudFlare dashboard, documentation, and marketing approach seemed overwhelming.

However, CloudFlare is a great fit for Spackle for one specific reason: latency. A CloudFlare worker can returned cached data *really* fast. And since they have data centers all over the world, it means that all customer compute should be near a CloudFlare node.

The primary problem was the developer experience. As stated above, the API has a large footprint and managing dozens of API endpoints outside of an opinionated routing framework seemed cumbersome.

That’s when I discovered the open source project [Unkey](https://www.unkey.dev). They have a product with remarkably similar requirements. They live in all of the critical paths of an application and therefore, need to have extremely high reliability and extremely low latency.

Their approach builds on top of [Hono](https://hono.dev/), a framework for wrapping edge functions across several providers (including CloudFlare workers). And to ensure low latency on their critical path routes, they lean on a tiered caching system involving in-memory and CloudFlare Zone caching.

This seemed like a promising approach. It would simplify the whole infrastructure stack, migrate the API to a framework better suited to APIs, and bring with it global low-latency availability.

## Proof Of Concept

The open question was whether or not CloudFlare would meet the latency requirements for Spackle. So before migrating the entire API codebase to Hono, it made sense to test the waters. I started by setting up a new domain `edge-next.spackle.so` and proxying calls to entitlements through a CloudFlare worker with tiered caching set up.

```jsx
import { TieredCache } from '@/lib/cache/tiered'
import { Context, Hono } from 'hono'

const app = new Hono()

app.get('/:id/state', async (c: Context) => {
  const id = c.req.param('id')
  const cache = c.get('cache') as TieredCache
  const Authorization = c.req.header('Authorization') ?? ''
  const url = `https://api.spackle.so/v1/customers/${id}/state`
  const headers = { Authorization }

  let [state, stale] = await cache.get('customerState', id)
  if (state) {
    console.log('Cache hit for', id)
    if (stale) {
      console.log('Revalidating stale cache for', id)
      c.executionCtx.waitUntil(
        fetch(url, { headers }).then(async (res) => {
          const newState = await res.json()
          return cache.set('customerState', id, newState)
        }),
      )
    }
    return c.json(state)
  }

  console.log('Cache miss for', id)
  const res = await fetch(url, { headers })
  state = await res.json()
  await c.get('cache').set('customerState', id, state)
  return c.json(state)
})

export default app
```

I released these changes and pointed a side project of mine ([Metathon](https://www.metathon.com), hosted on Render) at the new endpoint to see what latency looked like. The results were great. In the best cases, Metathon was able to retrieve entitlements in less than 20ms.

![latency](/posts/from-dynamodb-to-cloudflare/latency.png)

## Migrating

After validating the latency would work for Spackle, I set up a global CloudFlare route to handle all traffic and reassigned the `api.spackle.so` subdomain to the CloudFlare worker. If a route was missing, it would send the request to the Next.js app.

```jsx
app.all('/*', async (c: Context) => {
  // Proxy all other requests to the origin (Next.js @ Vercel)
  const url = `${c.get('origin')}${c.req.path}`
  console.log('Proxying request to', url)
  const res = await fetch(`${c.get('origin')}${c.req.path}`, {
    headers: c.req.raw.headers,
    body: c.req.raw.body,
    method: c.req.method,
  })
  c.status(res.status as StatusCode)
  if (res.headers.get('Content-Type') === 'application/json') {
    return c.json(await res.json())
  } else if (res.headers.get('Content-Type') === 'text/html') {
    return c.html(await res.text())
  } else {
    return c.text(await res.text())
  }
})
```

This allowed me to migrate routes one-by-one from the Next.js application to the new Hono codebase.

Ultimately, this process was entirely uninteresting. It was a lot of boilerplate-y grunt work that resulted in a git log with a lot of entries titled `migrates <route> to api-next (hono)`. But it was ultimately successful. After a couple of weeks on the new architecture, the old API was removed from the codebase and all related AWS infrastructure was torn down.

![commit](/posts/from-dynamodb-to-cloudflare/commit.png)

## Wrapping Up

While not an entire rewrite, there was quite a bit of grunt work that went into this project. Overall, I’m happy with how it turned out. The service is massively simplified and more performant than ever. I’m far from a serverless absolutist. But for an application like Spackle, it is a perfect fit.