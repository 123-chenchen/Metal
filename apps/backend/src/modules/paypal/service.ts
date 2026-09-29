import {
  AbstractPaymentProvider,
  BigNumber,
  MedusaError,
} from "@medusajs/framework/utils"
import type {
  AuthorizePaymentInput,
  AuthorizePaymentOutput,
  CancelPaymentInput,
  CapturePaymentInput,
  DeletePaymentInput,
  GetPaymentStatusInput,
  GetPaymentStatusOutput,
  InitiatePaymentInput,
  InitiatePaymentOutput,
  ProviderWebhookPayload,
  RefundPaymentInput,
  RetrievePaymentInput,
  UpdatePaymentInput,
  WebhookActionResult,
} from "@medusajs/framework/types"
import PaypalClient, { PaypalOptions } from "./client"

type Money = { currency_code: string; value: string }
type Transaction = { id: string; status: string; amount: Money }
type PaypalOrder = {
  id: string
  status: string
  intent: string
  purchase_units: {
    custom_id: string
    amount: Money
    payments?: { authorizations?: Transaction[]; captures?: Transaction[] }
  }[]
}

// Medusa v2 amounts are major units, not cents.
const currencies = new Set(
  "AUD BRL CAD CNY CZK DKK EUR HKD HUF ILS JPY MYR MXN TWD NZD NOK PHP PLN GBP SGD SEK CHF THB USD".split(
    " "
  )
)
export function paypalMoney(
  amount: InitiatePaymentInput["amount"],
  currency: string
): Money {
  const code = currency.toUpperCase()
  if (!currencies.has(code))
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      `PayPal does not support ${code}. Choose a supported currency such as USD.`
    )
  const value = new BigNumber(amount).numeric
  const digits = ["HUF", "JPY", "TWD"].includes(code) ? 0 : 2
  if (
    !Number.isFinite(value) ||
    value <= 0 ||
    Math.abs(value - Number(value.toFixed(digits))) > 0.00000001
  ) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Invalid amount or unsupported decimal precision for PayPal."
    )
  }
  return { currency_code: code, value: value.toFixed(digits) }
}

export default class PaypalProviderService extends AbstractPaymentProvider<PaypalOptions> {
  static identifier = "paypal"
  private client: PaypalClient
  private options: PaypalOptions

  static validateOptions(options: Record<string, unknown>) {
    if (!options.clientId || !options.clientSecret) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "PayPal requires clientId and clientSecret."
      )
    }
    if (!["sandbox", "live"].includes(String(options.environment))) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "PAYPAL_ENVIRONMENT must be sandbox or live."
      )
    }
    if (options.environment === "live" && !String(options.webhookId ?? "").trim()) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "PayPal live requires webhookId."
      )
    }
  }

  constructor(container: Record<string, unknown>, options: PaypalOptions) {
    super(container, options)
    this.options = options
    this.client = new PaypalClient(options)
  }

  private id(data: Record<string, unknown> | undefined, field = "id") {
    const value = data?.[field]
    if (typeof value !== "string" || !/^[a-zA-Z0-9_-]+$/.test(value)) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Missing or invalid PayPal ${field}.`
      )
    }
    return value
  }

  async initiatePayment(
    input: InitiatePaymentInput
  ): Promise<InitiatePaymentOutput> {
    return this.createOrder(input)
  }

  private async createOrder(
    input: InitiatePaymentInput,
    revision = "initial"
  ): Promise<InitiatePaymentOutput> {
    const sessionId = this.id(input.data, "session_id")
    const amount = paypalMoney(input.amount, input.currency_code)
    const order = await this.client.request<PaypalOrder>(
      "/v2/checkout/orders",
      "POST",
      {
        intent: "AUTHORIZE",
        purchase_units: [
          { reference_id: "default", custom_id: sessionId, amount },
        ],
        payment_source: {
          paypal: {
            experience_context: { shipping_preference: "NO_SHIPPING" },
          },
        },
      },
      `create:${sessionId}:${revision}:${amount.currency_code}:${amount.value}`
    )
    return {
      id: order.id,
      data: {
        id: order.id,
        session_id: sessionId,
        amount: amount.value,
        currency_code: amount.currency_code,
      },
    }
  }

  private async order(
    data: Record<string, unknown> | undefined,
    sessionId?: string
  ) {
    const order = await this.client.request<PaypalOrder>(
      `/v2/checkout/orders/${this.id(data)}`
    )
    const unit = order.purchase_units?.[0]
    if (
      order.intent !== "AUTHORIZE" ||
      order.purchase_units.length !== 1 ||
      unit.custom_id !== (sessionId || data?.session_id) ||
      unit.amount.currency_code !== data?.currency_code ||
      Number(unit.amount.value) !== Number(data?.amount)
    ) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "PayPal order does not match this payment session."
      )
    }
    return order
  }

  private state(order: PaypalOrder): GetPaymentStatusOutput["status"] {
    const payments = order.purchase_units[0].payments
    if (payments?.captures?.some((p) => p.status === "COMPLETED"))
      return "captured"
    const authorization = payments?.authorizations?.[0]
    if (authorization?.status === "CREATED") return "authorized"
    if (authorization?.status === "CAPTURED") return "captured"
    if (authorization?.status === "VOIDED") return "canceled"
    if (authorization && ["DENIED", "EXPIRED"].includes(authorization.status))
      return "error"
    return "requires_more"
  }

  async authorizePayment(
    input: AuthorizePaymentInput
  ): Promise<AuthorizePaymentOutput> {
    let order = await this.order(input.data, input.context?.idempotency_key)
    if (
      order.status === "APPROVED" &&
      !order.purchase_units[0].payments?.authorizations?.length
    ) {
      order = await this.client.request<PaypalOrder>(
        `/v2/checkout/orders/${order.id}/authorize`,
        "POST",
        {},
        `authorize:${order.id}`
      )
    }
    return { status: this.state(order), data: { ...input.data } }
  }

  async getPaymentStatus(
    input: GetPaymentStatusInput
  ): Promise<GetPaymentStatusOutput> {
    return { status: this.state(await this.order(input.data)) }
  }

  async retrievePayment(input: RetrievePaymentInput) {
    const order = await this.order(input.data)
    return { data: { ...input.data, paypal_status: order.status } }
  }

  async updatePayment(input: UpdatePaymentInput) {
    const amount = paypalMoney(input.amount, input.currency_code)
    if (
      input.data?.amount === amount.value &&
      input.data?.currency_code === amount.currency_code
    ) {
      return { data: input.data }
    }
    await this.cancelPayment(input)
    // A new order invalidates the previous buyer approval when totals change.
    return this.createOrder(input, this.id(input.data))
  }

  async capturePayment(input: CapturePaymentInput) {
    const order = await this.order(input.data)
    let capture = input.data?.capture_id
      ? await this.client.request<Transaction>(
          `/v2/payments/captures/${this.id(input.data, "capture_id")}`
        )
      : order.purchase_units[0].payments?.captures?.[0]
    if (!capture) {
      const authorization =
        order.purchase_units[0].payments?.authorizations?.[0]
      if (
        !authorization ||
        !["CREATED", "CAPTURED"].includes(authorization.status)
      )
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "PayPal payment is not authorized for capture."
        )
      capture = await this.client.request<Transaction>(
        `/v2/payments/authorizations/${this.id(authorization)}/capture`,
        "POST",
        {
          final_capture: true,
        },
        `capture:${authorization.id}`
      )
    }
    if (capture.status !== "COMPLETED")
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "PayPal capture is not completed. Retry after PayPal confirms it."
      )
    return { data: { ...input.data, capture_id: capture.id } }
  }

  async refundPayment(input: RefundPaymentInput) {
    const order = await this.order(input.data)
    const capture = input.data?.capture_id
      ? { id: this.id(input.data, "capture_id") }
      : order.purchase_units[0].payments?.captures?.[0]
    if (!capture)
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "PayPal payment has not been captured."
      )
    if (!input.context?.idempotency_key)
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "A refund idempotency key is required."
      )
    const refund = await this.client.request<Transaction>(
      `/v2/payments/captures/${this.id(capture)}/refund`,
      "POST",
      {
        amount: paypalMoney(input.amount, String(input.data?.currency_code)),
      },
      `refund:${input.context.idempotency_key}`
    )
    if (refund.status !== "COMPLETED")
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "PayPal refund is not completed. Retry this refund after checking PayPal."
      )
    return { data: { ...input.data, refund_id: refund.id } }
  }

  async cancelPayment(input: CancelPaymentInput) {
    const order = await this.order(input.data)
    if (
      input.data?.capture_id ||
      order.purchase_units[0].payments?.captures?.length ||
      order.purchase_units[0].payments?.authorizations?.some(
        (p) => p.status === "CAPTURED"
      )
    ) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Captured PayPal payments must be refunded, not voided."
      )
    }
    const authorization = order.purchase_units[0].payments?.authorizations?.[0]
    if (authorization && authorization.status !== "VOIDED") {
      await this.client.request(
        `/v2/payments/authorizations/${this.id(authorization)}/void`,
        "POST",
        {},
        `void:${authorization.id}`
      )
    }
    return { data: { ...input.data } }
  }

  async deletePayment(input: DeletePaymentInput) {
    // PayPal orders cannot be deleted and unapproved orders expire on their own.
    // Session cleanup must not depend on fetching an old order from PayPal.
    // Authorized payments are voided separately through cancelPayment.
    return { data: input.data }
  }

  async getWebhookActionAndData(
    payload: ProviderWebhookPayload["payload"]
  ): Promise<WebhookActionResult> {
    // Sandbox can use browser-driven completion without accepting any webhooks.
    if (!this.options.webhookId?.trim()) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "PayPal webhook processing is disabled until webhookId is configured."
      )
    }
    const header = (name: string) => {
      const value = payload.headers[name]
      if (typeof value !== "string" || !value)
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "Missing PayPal webhook signature headers."
        )
      return value
    }
    const verification = await this.client.request<{
      verification_status: string
    }>("/v1/notifications/verify-webhook-signature", "POST", {
      auth_algo: header("paypal-auth-algo"),
      cert_url: header("paypal-cert-url"),
      transmission_id: header("paypal-transmission-id"),
      transmission_sig: header("paypal-transmission-sig"),
      transmission_time: header("paypal-transmission-time"),
      webhook_id: this.options.webhookId,
      webhook_event: payload.data,
    })
    if (verification.verification_status !== "SUCCESS")
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Invalid PayPal webhook signature."
      )
    const event = payload.data as {
      event_type?: string
      resource?: {
        id?: string
        supplementary_data?: { related_ids?: { order_id?: string } }
      }
    }
    const supported = [
      "CHECKOUT.ORDER.APPROVED",
      "PAYMENT.AUTHORIZATION.CREATED",
      "PAYMENT.CAPTURE.COMPLETED",
    ]
    if (!supported.includes(event.event_type || ""))
      return { action: "not_supported" }
    const orderId =
      event.event_type === "CHECKOUT.ORDER.APPROVED"
        ? event.resource?.id
        : event.resource?.supplementary_data?.related_ids?.order_id
    const order = await this.client.request<PaypalOrder>(
      `/v2/checkout/orders/${this.id({ id: orderId })}`
    )
    const unit = order.purchase_units?.[0]
    if (
      order.intent !== "AUTHORIZE" ||
      order.purchase_units.length !== 1 ||
      !unit?.custom_id?.startsWith("payses_")
    )
      return { action: "not_supported" }
    const status = this.state(order)
    if (
      status !== "authorized" &&
      status !== "captured" &&
      order.status !== "APPROVED"
    )
      return { action: "not_supported" }
    return {
      action: status === "captured" ? "captured" : "authorized",
      data: {
        session_id: unit.custom_id,
        amount: new BigNumber(unit.amount.value),
      },
    }
  }
}
