type MetricBase = {
  metric: string
}

export type CacheMetric = MetricBase & {
  namespace: string
  key: string
  hit?: boolean
  stale?: boolean
  latency?: number
  tier?: string
}

export type Metric = CacheMetric

export interface Metrics {
  emit(metric: Metric): void
  flush(): Promise<void>
}
