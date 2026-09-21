import { MedusaRequest, MedusaResponse, MedusaNextFunction } from "@medusajs/framework/http"
import { z } from "zod"
import { removeProductOptionsSafelyWorkflow } from "../../../workflows/remove-product-options-safely"

// Handle the native Admin's remove-only request, then let its route refetch
// and format the product response using the normal Medusa field selection.
export async function removeProductOptionsSafely(req: MedusaRequest, _res: MedusaResponse, next: MedusaNextFunction) {
  const parsed = z.object({ remove: z.array(z.string()).min(1), add: z.array(z.unknown()).max(0).optional(), update: z.array(z.unknown()).max(0).optional() }).strict().safeParse(req.body)
  if (parsed.success) {
    await removeProductOptionsSafelyWorkflow(req.scope).run({ input: { product_id: req.params.id, remove: parsed.data.remove } })
    req.body = { ...parsed.data, remove: [] }
    if (req.validatedBody) Object.assign(req.validatedBody, { remove: [] })
  }
  next()
}
