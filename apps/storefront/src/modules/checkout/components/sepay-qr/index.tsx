import { convertToLocale } from "@lib/util/money"
import { Container, Text } from "@modules/common/components/ui"

type SepayPaymentData = {
  qr_code_url?: unknown
  payment_code?: unknown
  bank_account_number?: unknown
  bank_code?: unknown
}

type SepayQrPanelProps = {
  data: Record<string, unknown> | null | undefined
  amount?: number
  currencyCode?: string
}

const SepayQrPanel = ({ data, amount, currencyCode }: SepayQrPanelProps) => {
  const sepayData = (data ?? {}) as SepayPaymentData
  const qrCodeUrl =
    typeof sepayData.qr_code_url === "string" ? sepayData.qr_code_url : undefined
  const paymentCode =
    typeof sepayData.payment_code === "string" ? sepayData.payment_code : undefined
  const bankAccountNumber =
    typeof sepayData.bank_account_number === "string"
      ? sepayData.bank_account_number
      : undefined
  const bankCode =
    typeof sepayData.bank_code === "string" ? sepayData.bank_code : undefined

  if (!qrCodeUrl) {
    return null
  }

  return (
    <Container className="flex flex-col items-center gap-y-3 p-4 my-4 bg-ui-bg-subtle">
      <Text className="txt-medium-plus text-ui-fg-base">
        Quét mã QR để chuyển khoản
      </Text>
      {/* eslint-disable-next-line @next/next/no-img-element -- externally hosted, per-order QR image */}
      <img
        src={qrCodeUrl}
        alt="Mã QR chuyển khoản SePay"
        width={192}
        height={192}
        className="w-48 h-48"
      />
      <div className="flex flex-col items-center gap-y-1 text-small-regular text-ui-fg-subtle text-center">
        {bankAccountNumber && bankCode && (
          <Text>
            {bankCode.toUpperCase()} · {bankAccountNumber}
          </Text>
        )}
        {typeof amount === "number" && currencyCode && (
          <Text className="txt-medium-plus text-ui-fg-base">
            {convertToLocale({ amount, currency_code: currencyCode })}
          </Text>
        )}
        {paymentCode && (
          <Text>
            Nội dung chuyển khoản:{" "}
            <span className="font-semibold text-ui-fg-base">{paymentCode}</span>
          </Text>
        )}
      </div>
      <Text className="text-small-regular text-ui-fg-muted text-center">
        Đơn hàng sẽ tự động được xác nhận trong vài phút sau khi chúng tôi nhận
        được thanh toán. Vui lòng giữ đúng nội dung chuyển khoản để hệ thống
        đối soát chính xác.
      </Text>
    </Container>
  )
}

export default SepayQrPanel
