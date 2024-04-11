import { HonoEnv } from '@/lib/hono/env'
import { AxiomMetrics } from '@/lib/metrics/axiom'
import { ConsoleMetrics } from '@/lib/metrics/console'

export function initMetrics(env: HonoEnv['Bindings']) {
  return env.AXIOM_API_TOKEN
    ? new AxiomMetrics(env.AXIOM_DATASET, env.AXIOM_API_TOKEN)
    : new ConsoleMetrics()
}
