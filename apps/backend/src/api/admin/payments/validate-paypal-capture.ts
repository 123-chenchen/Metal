import type {
  MedusaRequest,
  MedusaResponse,
  MedusaNextFunction,
} from "@medusajs/framework/http"
import type { IPaymentModuleService } from "@medusajs/framework/types"
import { MathBN, MedusaError, Modules } from "@medusajs/framework/utils"

export async function validatePaypalCapture(
  req: MedusaRequest<{ amount?: number }>,
  _res: MedusaResponse,
  next: MedusaNextFunction
) {
  const amount = (req.validatedBody ?? req.body)?.amount
  if (amount !== undefined) {
    const payments = req.scope.resolve<IPaymentModuleService>(Modules.PAYMENT)
    const payment = await payments.retrievePayment(req.params.id)
    // Medusa 2.19 does not forward capture amount to the payment provider.
    if (
      payment.provider_id === "pp_paypal_paypal" &&
      !MathBN.eq(amount, payment.amount)
    ) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "PayPal requires capturing the full authorized amount. Partial refunds are supported after capture."
      )
    }
  }
  next()
}
