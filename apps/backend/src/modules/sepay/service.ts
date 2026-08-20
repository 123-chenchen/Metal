import { Logger } from "@medusajs/framework/types"
import { AbstractPaymentProvider, BigNumber, MedusaError } from "@medusajs/framework/utils"
import {
  AuthorizePaymentInput,
  AuthorizePaymentOutput,
  CancelPaymentInput,
  CancelPaymentOutput,
  CapturePaymentInput,
  CapturePaymentOutput,
  DeletePaymentInput,
  DeletePaymentOutput,
  GetPaymentStatusInput,
  GetPaymentStatusOutput,
  InitiatePaymentInput,
  InitiatePaymentOutput,
  PaymentSessionStatus,
  ProviderWebhookPayload,
  RefundPaymentInput,
  RefundPaymentOutput,
  RetrievePaymentInput,
  RetrievePaymentOutput,
  UpdatePaymentInput,
  UpdatePaymentOutput,
  WebhookActionResult,
} from "@medusajs/framework/types"
import { buildQrCodeUrl, findMatchingTransaction, generatePaymentCode } from "./sepay-client"
import { SepayOptions, SepayPaymentSessionData } from "./types"

type InjectedDependencies = {
  logger: Logger
}

class SepayProviderService extends AbstractPaymentProvider<SepayOptions> {
  static identifier = "sepay"

  protected logger_: Logger
  protected options_: SepayOptions

  constructor(cradle: InjectedDependencies, options: SepayOptions) {
    super(cradle, options)

    this.logger_ = cradle.logger
    this.options_ = options
  }

  /**
   * Deliberately non-throwing: the provider should still load and show up as
   * a selectable payment provider even before it's fully configured. Actual
   * use (generating a QR, checking a transaction) fails with a clear error
   * from the affected method instead, once someone picks it at checkout.
   */
  static validateOptions(options: Record<string, unknown>): void | never {
    const requiredKeys: (keyof SepayOptions)[] = [
      "bankAccountNumber",
      "bankCode",
      "apiToken",
      "webhookApiKey",
    ]

    const missingKeys = requiredKeys.filter((key) => !options[key])

    if (missingKeys.length) {
      console.warn(
        `[sepay] Missing options: ${missingKeys.join(", ")}. The SePay payment provider will appear in the admin but checkout will fail until these are set.`
      )
    }
  }

  async initiatePayment(input: InitiatePaymentInput): Promise<InitiatePaymentOutput> {
    const sessionId = (input.data?.session_id as string | undefined) ?? ""
    const amount = new BigNumber(input.amount).numeric
    const paymentCode = generatePaymentCode()

    const data: SepayPaymentSessionData = {
      session_id: sessionId,
      payment_code: paymentCode,
      amount,
      currency_code: input.currency_code,
      qr_code_url: buildQrCodeUrl(this.options_, { amount, paymentCode }),
      bank_account_number: this.options_.bankAccountNumber,
      bank_code: this.options_.bankCode,
    }

    return { id: paymentCode, data }
  }

  async updatePayment(input: UpdatePaymentInput): Promise<UpdatePaymentOutput> {
    const previous = (input.data ?? {}) as SepayPaymentSessionData
    const amount = new BigNumber(input.amount).numeric
    const paymentCode = previous.payment_code ?? generatePaymentCode()

    const data: SepayPaymentSessionData = {
      ...previous,
      amount,
      currency_code: input.currency_code,
      payment_code: paymentCode,
      qr_code_url: buildQrCodeUrl(this.options_, { amount, paymentCode }),
    }

    return { data }
  }

  async authorizePayment(input: AuthorizePaymentInput): Promise<AuthorizePaymentOutput> {
    const { status, data } = await this.resolveConfirmation_(
      (input.data ?? {}) as SepayPaymentSessionData
    )

    return { status, data }
  }

  async getPaymentStatus(input: GetPaymentStatusInput): Promise<GetPaymentStatusOutput> {
    const { status, data } = await this.resolveConfirmation_(
      (input.data ?? {}) as SepayPaymentSessionData
    )

    return { status, data }
  }

  /**
   * The source of truth for whether a bank transfer has landed. Called both
   * when checkout authorizes the session and again whenever the webhook
   * route re-triggers authorization, since the session's stored `data`
   * cannot carry the webhook payload across those two separate invocations.
   */
  private async resolveConfirmation_(
    data: SepayPaymentSessionData
  ): Promise<{ status: PaymentSessionStatus; data: SepayPaymentSessionData }> {
    if (data.sepay_transaction_id) {
      return { status: "captured", data }
    }

    if (!data.payment_code) {
      return { status: "pending_authorization", data }
    }

    const transaction = await findMatchingTransaction(this.options_, {
      paymentCode: data.payment_code,
      minAmount: data.amount,
    })

    if (!transaction) {
      return { status: "pending_authorization", data }
    }

    return {
      status: "captured",
      data: {
        ...data,
        sepay_transaction_id: transaction.id,
        sepay_reference_code: transaction.reference_number,
      },
    }
  }

  async capturePayment(input: CapturePaymentInput): Promise<CapturePaymentOutput> {
    return { data: input.data }
  }

  async cancelPayment(input: CancelPaymentInput): Promise<CancelPaymentOutput> {
    return { data: input.data }
  }

  async deletePayment(input: DeletePaymentInput): Promise<DeletePaymentOutput> {
    return { data: input.data }
  }

  async retrievePayment(input: RetrievePaymentInput): Promise<RetrievePaymentOutput> {
    return { data: input.data }
  }

  async refundPayment(_input: RefundPaymentInput): Promise<RefundPaymentOutput> {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      "SePay bank transfers cannot be refunded automatically. Transfer the refund back manually and record it on the order."
    )
  }

  async getWebhookActionAndData(
    payload: ProviderWebhookPayload["payload"]
  ): Promise<WebhookActionResult> {
    const data = payload.data as {
      medusa_session_id?: string
      transferAmount?: number
    }

    if (!data.medusa_session_id) {
      this.logger_.warn(
        "[sepay] Received a webhook event that could not be matched to a payment session."
      )
      return { action: "not_supported" }
    }

    return {
      action: "authorized",
      data: {
        session_id: data.medusa_session_id,
        amount: new BigNumber(data.transferAmount ?? 0),
      },
    }
  }
}

export default SepayProviderService
