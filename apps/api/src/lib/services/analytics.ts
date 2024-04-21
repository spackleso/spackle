export type AnalyticsResponse = {
  meta: [
    {
      name: string
      type: string
    },
  ]
  data: any[]
}

export class AnalyticsService {
  private readonly cloudflareAccountId: string
  private readonly cloudflareApiKey: string

  constructor(cloudflareAccountId: string, cloudflareApiKey: string) {
    this.cloudflareAccountId = cloudflareAccountId
    this.cloudflareApiKey = cloudflareApiKey
  }

  writeDataPoint(
    dataset: AnalyticsEngineDataset,
    dataPoint: AnalyticsEngineDataPoint,
  ) {
    dataset.writeDataPoint(dataPoint)
  }

  async query(query: string): Promise<AnalyticsResponse['data']> {
    if (!this.cloudflareAccountId || !this.cloudflareApiKey) {
      return []
    }

    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${this.cloudflareAccountId}/analytics_engine/sql`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.cloudflareApiKey}`,
          'Content-Type': 'application/json',
        },
        body: query,
      },
    )

    if (!response.ok) {
      const body = await response.text()
      throw new Error(`Failed to query analytics (${response.status}): ${body}`)
    }

    const body = (await response.json()) as AnalyticsResponse
    return body.data
  }
}
