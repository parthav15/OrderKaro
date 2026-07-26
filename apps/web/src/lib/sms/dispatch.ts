import prisma from "@/lib/prisma"
import { Decimal } from "@prisma/client/runtime/library"
import { isTwilioConfigured, sendSms, sendWhatsAppTemplate } from "@/lib/twilio"
import { analyzeSms } from "@/lib/sms/segments"
import { computeSmsCharge, computeWhatsAppCharge, getSmsSettings } from "@/lib/sms/charge"
import { SMS_TEMPLATES, WHATSAPP_TEMPLATES, type SmsContext } from "@/lib/sms/templates"
import type { SmsNotificationKey } from "@orderkaro/shared"

type NotifyField =
  | "notifyOrderPlaced"
  | "notifyOrderAccepted"
  | "notifyOrderPreparing"
  | "notifyOrderReady"
  | "notifyOrderCompleted"
  | "notifyOrderCancelled"
  | "notifyOwnerNewOrder"
  | "notifyOwnerOrderCancelled"
  | "notifyOwnerDailySummary"
  | "notifyOwnerPlanExpiring"

export interface SmsRestaurant {
  id: string
  name: string
  smsEnabled: boolean
  whatsappEnabled: boolean
  smsMarginPercent: Decimal | number | string
  notifyOrderPlaced: boolean
  notifyOrderAccepted: boolean
  notifyOrderPreparing: boolean
  notifyOrderReady: boolean
  notifyOrderCompleted: boolean
  notifyOrderCancelled: boolean
  notifyOwnerNewOrder: boolean
  notifyOwnerOrderCancelled: boolean
  notifyOwnerDailySummary: boolean
  notifyOwnerPlanExpiring: boolean
}

const TOGGLE: Record<SmsNotificationKey, NotifyField> = {
  ORDER_PLACED: "notifyOrderPlaced",
  ORDER_ACCEPTED: "notifyOrderAccepted",
  ORDER_PREPARING: "notifyOrderPreparing",
  ORDER_READY: "notifyOrderReady",
  ORDER_COMPLETED: "notifyOrderCompleted",
  ORDER_CANCELLED: "notifyOrderCancelled",
  OWNER_NEW_ORDER: "notifyOwnerNewOrder",
  OWNER_ORDER_CANCELLED: "notifyOwnerOrderCancelled",
  OWNER_DAILY_SUMMARY: "notifyOwnerDailySummary",
  OWNER_PLAN_EXPIRING: "notifyOwnerPlanExpiring",
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

export interface DispatchNotificationArgs {
  restaurant: SmsRestaurant
  key: SmsNotificationKey
  toPhone: string | null | undefined
  context: SmsContext
  orderId?: string | null
  statusCallbackUrl?: string
}

type Settings = Awaited<ReturnType<typeof getSmsSettings>>

async function tryWhatsApp(
  args: DispatchNotificationArgs,
  settings: Settings,
  to: string
): Promise<boolean | null> {
  if (!settings.whatsappEnabled) return null
  if (!args.restaurant.whatsappEnabled) return null
  if (!settings.whatsappSender) return null
  const templateMap = (settings.whatsappTemplates as Record<string, string> | null) ?? {}
  const contentSid = templateMap[args.key]
  if (!contentSid) return null
  const template = WHATSAPP_TEMPLATES[args.key]
  if (!template) return null

  const charge = await computeWhatsAppCharge(args.restaurant.smsMarginPercent)
  let sid: string | null = null
  let failed = false
  let errorMessage: string | null = null
  try {
    const result = await sendWhatsAppTemplate(
      to,
      settings.whatsappSender,
      contentSid,
      template.variables(args.context),
      args.statusCallbackUrl
    )
    sid = result.sid
  } catch (err) {
    failed = true
    errorMessage = err instanceof Error ? err.message : "WhatsApp send failed"
  }

  await prisma.smsMessage.create({
    data: {
      restaurantId: args.restaurant.id,
      orderId: args.orderId ?? null,
      template: args.key,
      channel: "WHATSAPP",
      toPhone: to,
      body: template.text,
      segments: 1,
      encoding: "WHATSAPP",
      costAmount: failed ? new Decimal(0) : charge.costAmount,
      sellAmount: failed ? new Decimal(0) : charge.sellAmount,
      marginAmount: failed ? new Decimal(0) : charge.marginAmount,
      marginPercent: charge.marginPercent,
      twilioSid: sid,
      status: failed ? "FAILED" : "SENT",
      billingStatus: failed ? "VOID" : "PENDING",
      errorMessage,
    },
  })

  return failed ? false : true
}

async function trySms(
  args: DispatchNotificationArgs,
  settings: Settings,
  to: string
): Promise<boolean> {
  if (!settings.enabled) return false
  if (!args.restaurant.smsEnabled) return false
  const template = SMS_TEMPLATES[args.key]
  if (!template) return false

  const body = template.render(args.context)
  const { encoding, segments } = analyzeSms(body)
  const charge = await computeSmsCharge(args.restaurant.smsMarginPercent, segments)

  let sid: string | null = null
  let failed = false
  let errorMessage: string | null = null
  try {
    const result = await sendSms(to, body, args.statusCallbackUrl)
    sid = result.sid
  } catch (err) {
    failed = true
    errorMessage = err instanceof Error ? err.message : "SMS send failed"
  }

  await prisma.smsMessage.create({
    data: {
      restaurantId: args.restaurant.id,
      orderId: args.orderId ?? null,
      template: args.key,
      channel: "SMS",
      toPhone: to,
      body,
      segments,
      encoding,
      costAmount: failed ? new Decimal(0) : charge.costAmount,
      sellAmount: failed ? new Decimal(0) : charge.sellAmount,
      marginAmount: failed ? new Decimal(0) : charge.marginAmount,
      marginPercent: charge.marginPercent,
      twilioSid: sid,
      status: failed ? "FAILED" : "SENT",
      billingStatus: failed ? "VOID" : "PENDING",
      errorMessage,
    },
  })

  return !failed
}

export async function dispatchNotification(args: DispatchNotificationArgs): Promise<boolean> {
  try {
    if (!isTwilioConfigured()) return false
    if (!args.restaurant[TOGGLE[args.key]]) return false
    const to = toE164(args.toPhone)
    if (!to) return false
    const settings = await getSmsSettings()

    const viaWhatsApp = await tryWhatsApp(args, settings, to)
    if (viaWhatsApp === true) return true

    return await trySms(args, settings, to)
  } catch {
    return false
  }
}

export const dispatchSms = dispatchNotification
export type DispatchSmsArgs = DispatchNotificationArgs
