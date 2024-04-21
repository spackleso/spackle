import { Context } from 'hono'
import { HonoEnv } from '@/lib/hono/env'
import { initServices } from '@/lib/services/init'
import { initCache } from '@/lib/cache/init'
import { initMetrics } from '../metrics/init'

export function initMiddlewareContext() {
  return async (c: Context<HonoEnv>, next: () => Promise<void>) => {
    const metrics = initMetrics(c.env)
    c.set('metrics', metrics)
    c.set('cache', initCache(c.env, metrics))
    await next()
    c.executionCtx.waitUntil(metrics.flush())
  }
}

export function initServiceContext(exemptPaths: string[] = []) {
  return async (c: Context<HonoEnv>, next: () => Promise<void>) => {
    const matchedPaths = c.req.matchedRoutes
      .map((r) => r.path)
      .filter((p) => !p.includes('*'))

    if (matchedPaths.filter((p) => exemptPaths.includes(p)).length) {
      await next()
    } else {
      const services = initServices(c.get('sentry'), c.get('cache'), c.env)
      c.set('analyticsService', services.analyticsService)
      c.set('telemetry', services.telemetryService)
      c.set('db', services.db)
      c.set('dbService', services.dbService)
      c.set('liveStripe', services.liveStripe)
      c.set('testStripe', services.testStripe)
      c.set('stripeService', services.stripeService)
      c.set('syncService', services.syncService)
      c.set('entitlementsService', services.entitlementsService)
      c.set('tokenService', services.tokenService)
      c.set('billingService', services.billingService)
      c.set('pricingTablesService', services.pricingTablesService)
      await next()
      await services.client.end()
    }
  }
}
