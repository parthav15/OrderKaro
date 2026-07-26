import prisma from "@/lib/prisma"
import { Decimal } from "@prisma/client/runtime/library"
import { isTwilioConfigured, sendSms } from "@/lib/twilio"
import { analyzeSms } from "@/lib/sms/segments"
import { computeSmsCharge, getSmsSettings } from "@/lib/sms/charge"
import { SMS_TEMPLATES, type SmsContext } from "@/lib/sms/templates"
import type { SmsNotificationKey } from "@orderkaro/shared"

type NotifyField =
  | "notifyOrderPlaced"
  | "notifyOrderAccepted"
  | "notifyOrderPreparing"
  | "notifyOrderReady"
  | "notifyOrderCompleted"
  | "notifyOrderCancelled"
  | "notifyOwnerNewOrder"

export interface SmsRestaurant {
  id: string
  name: string
  smsEnabled: boolean
  smsMarginPercent: Decimal | number | string
  notifyOrderPlaced: boolean
  notifyOrderAccepted: boolean
  notifyOrderPreparing: boolean
  notifyOrderReady: boolean
  notifyOrderCompleted: boolean
  notifyOrderCancelled: boolean
  notifyOwnerNewOrder: boolean
}

const TOGGLE: Record<SmsNotificationKey, NotifyField> = {
  ORDER_PLACED: "notifyOrderPlaced",
  ORDER_ACCEPTED: "notifyOrderAccepted",
  ORDER_PREPARING: "notifyOrderPreparing",
  ORDER_READY: "notifyOrderReady",
  ORDER_COMPLETED: "notifyOrderCompleted",
  ORDER_CANCELLED: "notifyOrderCancelled",
  OWNER_NEW_ORDER: "notifyOwnerNewOrder",
}

export function toE164(phone: string | null | undefined): string | null {
  if (!phone) return null
  const trimmed = phone.trim()
  if (!trimmed) return null
  if (trimmed.startsWith("+")) return trimmed
  const digits = trimmed.replace(/\D/g, "")
  if (digits.length === 10) return `+91${digits}`
  if (digits.length > 10) return `+${digits}`
  return null
}

export interface DispatchSmsArgs {
  restaurant: SmsRestaurant
  key: SmsNotificationKey
  toPhone: string | null | undefined
  context: SmsContext
  orderId?: string | null
  statusCallbackUrl?: string
}

export async function dispatchSms(args: DispatchSmsArgs): Promise<boolean> {
  try {
    if (!isTwilioConfigured()) return false
    const { restaurant, key } = args
    if (!restaurant.smsEnabled) return false
    const template = SMS_TEMPLATES[key]
    if (!template) return false
    if (!restaurant[TOGGLE[key]]) return false

    const settings = await getSmsSettings()
    if (!settings.enabled) return false

    const to = toE164(args.toPhone)
    if (!to) return false

    const body = template.render(args.context)
    const { encoding, segments } = analyzeSms(body)
    const charge = await computeSmsCharge(restaurant.smsMarginPercent, segments)

    let sid: string | null = null
    let delivery: "SENT" | "FAILED" = "SENT"
    let errorMessage: string | null = null
    try {
      const result = await sendSms(to, body, args.statusCallbackUrl)
      sid = result.sid
    } catch (err) {
      delivery = "FAILED"
      errorMessage = err instanceof Error ? err.message : "SMS send failed"
    }

    const failed = delivery === "FAILED"
    await prisma.smsMessage.create({
      data: {
        restaurantId: restaurant.id,
        orderId: args.orderId ?? null,
        template: key,
        toPhone: to,
        body,
        segments,
        encoding,
        costAmount: failed ? new Decimal(0) : charge.costAmount,
        sellAmount: failed ? new Decimal(0) : charge.sellAmount,
        marginAmount: failed ? new Decimal(0) : charge.marginAmount,
        marginPercent: charge.marginPercent,
        twilioSid: sid,
        status: delivery,
        billingStatus: failed ? "VOID" : "PENDING",
        errorMessage,
      },
    })
    return !failed
  } catch {
    return false
  }
}
