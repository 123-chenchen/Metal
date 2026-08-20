import crypto from "crypto"
import { MedusaError } from "@medusajs/framework/utils"
import { SEPAY_PAYMENT_CODE_PREFIX, SepayOptions, SepayTransaction } from "./types"

const SEPAY_TRANSACTIONS_URL = "https://userapi.sepay.vn/v2/transactions"
const SEPAY_QR_BASE_URL = "https://qr.sepay.vn/img"

export function generatePaymentCode(): string {
  const random = crypto.randomBytes(5).toString("hex").toUpperCase()
  return `${SEPAY_PAYMENT_CODE_PREFIX}${random}`
}

export function buildQrCodeUrl(
  options: SepayOptions,
  input: { amount: number; paymentCode: string }
): string {
  const params = new URLSearchParams({
    acc: options.bankAccountNumber,
    bank: options.bankCode,
    amount: String(Math.trunc(input.amount)),
    des: input.paymentCode,
  })

  if (options.qrTemplate) {
    params.set("template", options.qrTemplate)
  }

  if (options.accountHolderName) {
    params.set("holder", options.accountHolderName)
  }

  return `${SEPAY_QR_BASE_URL}?${params.toString()}`
}

/**
 * Looks up a matching incoming bank transaction for a payment code via SePay's
 * Transaction API. Used as the source of truth when authorizing a payment,
 * since the payment session's stored `data` cannot be trusted to reflect a
 * webhook that may have arrived out of band.
 */
export async function findMatchingTransaction(
  options: SepayOptions,
  input: { paymentCode: string; minAmount: number }
): Promise<SepayTransaction | null> {
  const params = new URLSearchParams({
    q: input.paymentCode,
    transfer_type: "in",
    per_page: "20",
  })

  const response = await fetch(`${SEPAY_TRANSACTIONS_URL}?${params.toString()}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${options.apiToken}`,
    },
  })

  if (!response.ok) {
    throw new MedusaError(
      MedusaError.Types.UNEXPECTED_STATE,
      `SePay transaction lookup failed with status ${response.status}`
    )
  }

  const body = (await response.json()) as { data?: SepayTransaction[] }
  const transactions = body.data ?? []

  return (
    transactions.find(
      (transaction) =>
        transaction.transfer_type === "in" &&
        transaction.transaction_content?.includes(input.paymentCode) &&
        transaction.amount_in >= input.minAmount
    ) ?? null
  )
}
