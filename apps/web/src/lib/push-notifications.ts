import prisma from "./prisma"

interface PushMessage {
  to: string
  title: string
  body: string
  data?: Record<string, string>
  sound?: string
  channelId?: string
}

export async function sendPushToConsumer(
  consumerId: string,
  title: string,
  body: string,
  data?: Record<string, string>
) {
  const tokens = await prisma.deviceToken.findMany({
    where: { consumerId },
    select: { token: true },
  })

  if (tokens.length === 0) return

  const messages: PushMessage[] = tokens.map((t) => ({
    to: t.token,
    title,
    body,
    data,
    sound: "default",
    channelId: "orders",
  }))

  try {
    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(messages),
    })

    const result = await response.json()

    if (result.data) {
      const invalidTokens: string[] = []
      result.data.forEach((receipt: any, index: number) => {
        if (receipt.status === "error" && receipt.details?.error === "DeviceNotRegistered") {
          invalidTokens.push(tokens[index].token)
        }
      })
      if (invalidTokens.length > 0) {
        await prisma.deviceToken.deleteMany({
          where: { token: { in: invalidTokens } },
        })
      }
    }
  } catch {}
}
