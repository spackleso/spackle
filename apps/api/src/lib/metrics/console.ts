import { Metric, Metrics } from './interface'

export class ConsoleMetrics implements Metrics {
  private metrics: Metric[] = []

  constructor() {}

  emit(event: Metric) {
    this.metrics.push(event)
  }

  async flush() {
    console.debug('metrics', this.metrics)
    this.metrics = []
  }
}
