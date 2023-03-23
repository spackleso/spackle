import { WebClient, LogLevel } from '@slack/web-api'

const apiKey = process.env.SLACK_API_KEY || ''

const client = new WebClient(apiKey, {
  logLevel: LogLevel.DEBUG,
})

export async function publishMessage(channel: string, text: string) {
  try {
    const result = await client.chat.postMessage({
      channel,
      text,
    })

    console.log(result)
  } catch (error) {
    console.error(error)
  }
}
