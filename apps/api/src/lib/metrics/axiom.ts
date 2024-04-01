import { Axiom } from '@axiomhq/js'
import type { Metric } from './interface'
import type { Metrics } from './interface'

export class AxiomMetrics implements Metrics {
  private readonly axiomDataset: string
  private readonly ax: Axiom
  private readonly defaultFields: Record<string, unknown>

  constructor(
    axiomDataset: string,
    axiomToken: string,
    defaultFields?: Record<string, unknown>,
  ) {
    this.axiomDataset = axiomDataset
    this.ax = new Axiom({
      token: axiomToken,
    })
    this.defaultFields = defaultFields ?? {}
  }

  public emit(metric: Metric): void {
    this.ax.ingest(this.axiomDataset, [
      {
        _time: Date.now(),
        ...this.defaultFields,
        metric,
      },
    ])
  }

  public async flush(): Promise<void> {
    await this.ax.flush().catch((err) => {
      console.error('unable to flush logs to axiom', err)
    })
  }
}
