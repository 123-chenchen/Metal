import AmexBadge from "@modules/common/icons/amex-badge"
import ApplePayBadge from "@modules/common/icons/apple-pay-badge"
import MastercardBadge from "@modules/common/icons/mastercard-badge"
import PayPalBadge from "@modules/common/icons/paypal-badge"
import VisaBadge from "@modules/common/icons/visa-badge"

const PAYMENT_BADGES = [
  { name: "American Express", Badge: AmexBadge },
  { name: "Apple Pay", Badge: ApplePayBadge },
  { name: "Mastercard", Badge: MastercardBadge },
  { name: "PayPal", Badge: PayPalBadge },
  { name: "Visa", Badge: VisaBadge },
]

const PaymentBadges = () => {
  return (
    <ul className="flex flex-wrap items-center gap-2">
      {PAYMENT_BADGES.map(({ name, Badge }) => (
        <li key={name} title={name}>
          <Badge className="rounded-[3px]" />
        </li>
      ))}
    </ul>
  )
}

export default PaymentBadges
