import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { upsertPromoBarWorkflow } from "../../../../workflows/home-content"

type PromoBarPayload = {
  text?: unknown
  is_active?: unknown
}

export async function POST(
  req: MedusaRequest<PromoBarPayload>,
  res: MedusaResponse
): Promise<void> {
  const text = req.body.text

  if (typeof text !== "string" || !text.trim()) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "text is required")
  }

  const isActive = req.body.is_active !== false

  const { result: promoBar } = await upsertPromoBarWorkflow(req.scope).run({
    input: {
      text: text.trim(),
      is_active: isActive,
    },
  })

  res.status(200).json({ promo_bar: promoBar })
}
