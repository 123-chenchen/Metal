import crypto from "crypto"
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, Modules, PaymentWebhookEvents } from "@medusajs/framework/utils"
import {
  SEPAY_PAYMENT_CODE_PATTERN,
  SEPAY_PAYMENT_PROVIDER_ID,
  SepayPaymentSessionData,
  SepayWebhookPayload,
} from "../../../modules/sepay/types"

/**
 * Custom, authenticated entry point for SePay's payment webhook.
 *
 * Medusa's built-in `/hooks/payment/:provider` route has no authentication
 * and replies with an empty 200 body, so it can't be used directly here:
 * SePay requires every webhook call to be authenticated and expects the
 * response body to be exactly `{"success": true}`. This route validates the
 * request, resolves it to a payment session, then re-emits the same event
 * the built-in route uses so the rest of the payment flow (authorization,
 * cart completion) runs through Medusa's normal machinery.
 */
export async function POST(req: MedusaRequest, res: MedusaResponse): Promise<void> {
  const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER)
  const webhookApiKey = process.env.SEPAY_WEBHOOK_API_KEY

  if (!webhookApiKey || !isAuthorized(req, webhookApiKey)) {
    res.status(401).json({ success: false })
    return
  }

  const payload = req.body as SepayWebhookPayload

  if (payload.transferType !== "in") {
    res.status(200).json({ success: true })
    return
  }

  const paymentCode = extractPaymentCode(payload)

  if (!paymentCode) {
    logger.warn(
      `[sepay] Webhook transaction ${payload.id} did not contain a recognizable payment code.`
    )
    res.status(200).json({ success: true })
    return
  }

  try {
    const paymentModuleService = req.scope.resolve(Modules.PAYMENT)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

    const candidateSessions = await paymentModuleService.listPaymentSessions(
      {
        provider_id: SEPAY_PAYMENT_PROVIDER_ID,
        created_at: { $gte: oneDayAgo },
      },
      { take: 200 }
    )

    const matchedSession = candidateSessions.find((session) => {
      const data = session.data as SepayPaymentSessionData
      return session.status === "pending" && data.payment_code === paymentCode
    })

    if (!matchedSession) {
      logger.warn(
        `[sepay] Webhook transaction ${payload.id} matched payment code ${paymentCode} but no pending payment session was found.`
      )
      res.status(200).json({ success: true })
      return
    }

    const eventBusService = req.scope.resolve(Modules.EVENT_BUS)
    const eventPayload = { ...payload, medusa_session_id: matchedSession.id }

    await eventBusService.emit({
      name: PaymentWebhookEvents.WebhookReceived,
      data: {
        provider: SEPAY_PAYMENT_PROVIDER_ID,
        payload: {
          data: eventPayload,
          rawData: Buffer.from(JSON.stringify(eventPayload)),
          headers: req.headers,
        },
      },
    })

    res.status(200).json({ success: true })
  } catch (error) {
    logger.error(
      `[sepay] Failed to process webhook transaction ${payload.id}`,
      error instanceof Error ? error : undefined
    )
    res.status(500).json({ success: false })
  }
}

function isAuthorized(req: MedusaRequest, webhookApiKey: string): boolean {
  const header = req.headers.authorization ?? ""
  const expected = `Apikey ${webhookApiKey}`

  const headerBuffer = Buffer.from(header)
  const expectedBuffer = Buffer.from(expected)

  if (headerBuffer.length !== expectedBuffer.length) {
    return false
  }

  return crypto.timingSafeEqual(headerBuffer, expectedBuffer)
}

function extractPaymentCode(payload: SepayWebhookPayload): string | null {
  const haystacks = [payload.code, payload.content, payload.description]

  for (const haystack of haystacks) {
    const match = haystack?.match(SEPAY_PAYMENT_CODE_PATTERN)
    if (match) {
      return match[0].toUpperCase()
    }
  }

  return null
}
