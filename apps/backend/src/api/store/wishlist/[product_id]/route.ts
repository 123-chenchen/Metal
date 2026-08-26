import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import WishlistModuleService from "../../../../modules/wishlist/service"
import { WISHLIST_MODULE } from "../../../../modules/wishlist"

export async function DELETE(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const wishlistModuleService: WishlistModuleService = req.scope.resolve(
    WISHLIST_MODULE
  )

  const productId = req.params.product_id
  const imageIndex = Math.max(
    1,
    Math.floor(Number(req.query.image_index) || 1)
  )
  const customerId = req.auth_context?.actor_id || null
  const guestId =
    typeof req.query.guest_id === "string" ? req.query.guest_id : null

  if (!customerId && !guestId) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "guest_id is required when not logged in"
    )
  }

  const existing = await wishlistModuleService.listWishlistItems({
    product_id: productId,
    image_index: imageIndex,
    ...(customerId ? { customer_id: customerId } : { guest_id: guestId! }),
  })

  if (existing.length) {
    await wishlistModuleService.deleteWishlistItems(
      existing.map((item) => item.id)
    )
  }

  res.status(200).json({ success: true })
}
