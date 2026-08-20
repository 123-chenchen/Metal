/**
 * `pp_{identifier}_{id}`, derived from the provider's static `identifier`
 * ("sepay") and the `id` it's registered under in medusa-config.ts ("sepay").
 */
export const SEPAY_PAYMENT_PROVIDER_ID = "pp_sepay_sepay"

/**
 * Payment codes look like `SEVQR` followed by 10 hex characters (see
 * `generatePaymentCode` in sepay-client.ts). The prefix makes the code easy
 * to spot in a bank statement; the pattern lets the webhook route recover it
 * from free-form transfer content.
 */
export const SEPAY_PAYMENT_CODE_PREFIX = "SEVQR"
export const SEPAY_PAYMENT_CODE_PATTERN = /SEVQR[0-9A-F]{10}/i

export type SepayOptions = {
  bankAccountNumber: string
  bankCode: string
  accountHolderName?: string
  apiToken: string
  webhookApiKey: string
  qrTemplate?: string
}

export type SepayPaymentSessionData = {
  session_id?: string
  payment_code: string
  amount: number
  currency_code: string
  qr_code_url: string
  bank_account_number: string
  bank_code: string
  sepay_transaction_id?: string
  sepay_reference_code?: string
}

export type SepayWebhookPayload = {
  id: number
  gateway: string
  transactionDate: string
  accountNumber: string
  subAccount: string | null
  code: string | null
  content: string
  transferType: "in" | "out"
  description: string
  transferAmount: number
  accumulated: number
  referenceCode: string
}

export type SepayTransaction = {
  id: string
  transaction_date: string
  account_number: string
  transfer_type: "in" | "out"
  amount_in: number
  amount_out: number
  accumulated: number
  transaction_content: string
  reference_number: string
  code: string | null
}
