import { MedusaRequest, MedusaResponse, MedusaNextFunction } from "@medusajs/framework/http"
import { MedusaError, Modules } from "@medusajs/framework/utils"
import { resolveCartDesign } from "../../lib/design-cart"

export async function validateDesignCartItem(req: MedusaRequest, _res: MedusaResponse, next: MedusaNextFunction) {
  const body = req.body as { variant_id?: string; metadata?: Record<string, unknown> }
  if (body.variant_id) {
    body.metadata = await resolveCartDesign(req.scope, body.variant_id, body.metadata ?? {})
    if (req.validatedBody) Object.assign(req.validatedBody, { metadata: body.metadata })
  }
  next()
}

export async function preventDesignSnapshotEdit(req: MedusaRequest, _res: MedusaResponse, next: MedusaNextFunction) {
  const body = req.body as { metadata?: Record<string, unknown> }
  if ("metadata" in body) {
    const carts = req.scope.resolve(Modules.CART)
    const item = await carts.retrieveLineItem(req.params.line_id)
    if (item.metadata?.selected_design_id) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "Design snapshots cannot be replaced. Remove the item and add it again")
    }
  }
  if (body.metadata && Object.keys(body.metadata).some((key) => key.startsWith("selected_"))) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "Remove the item and add the selected design again")
  }
  next()
}

export async function validateCartDesignAvailability(req: MedusaRequest, _res: MedusaResponse, next: MedusaNextFunction) {
  const carts = req.scope.resolve(Modules.CART)
  const cart = await carts.retrieveCart(req.params.id, { relations: ["items"] })
  for (const item of cart.items ?? []) {
    if (item.metadata?.selected_design_id && item.variant_id) {
      await resolveCartDesign(req.scope, item.variant_id, item.metadata)
    }
  }
  next()
}
