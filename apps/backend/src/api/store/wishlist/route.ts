import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import WishlistModuleService from "../../../modules/wishlist/service"
import { WISHLIST_MODULE } from "../../../modules/wishlist"

function getOwner(req: AuthenticatedMedusaRequest) {
  const customerId = req.auth_context?.actor_id || null
  const guestId =
    typeof req.query.guest_id === "string" ? req.query.guest_id : null

  return { customerId, guestId }
}

export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const wishlistModuleService: WishlistModuleService = req.scope.resolve(
    WISHLIST_MODULE
  )
  const { customerId, guestId } = getOwner(req)

  if (!customerId && !guestId) {
    res.status(200).json({ items: [] })
    return
  }

  // A logged-in customer might still be carrying a guest_id from before
  // they signed in (e.g. items they favorited while browsing as a guest).
  // Migrate those over to their account so nothing gets lost on login.
  if (customerId && guestId) {
    const guestItems = await wishlistModuleService.listWishlistItems({
      guest_id: guestId,
    })

    if (guestItems.length) {
      const existingCustomerItems = await wishlistModuleService.listWishlistItems(
        { customer_id: customerId }
      )
      const existingKeys = new Set(
        existingCustomerItems.map(
          (item) => `${item.product_id}:${item.image_index}`
        )
      )

      const toClaim = guestItems.filter(
        (item) => !existingKeys.has(`${item.product_id}:${item.image_index}`)
      )
      const toRemove = guestItems.filter((item) =>
        existingKeys.has(`${item.product_id}:${item.image_index}`)
      )

      if (toClaim.length) {
        await wishlistModuleService.updateWishlistItems(
          toClaim.map((item) => ({
            id: item.id,
            customer_id: customerId,
            guest_id: null,
          }))
        )
      }

      if (toRemove.length) {
        await wishlistModuleService.deleteWishlistItems(
          toRemove.map((item) => item.id)
        )
      }
    }
  }

  const items = await wishlistModuleService.listWishlistItems(
    customerId ? { customer_id: customerId } : { guest_id: guestId! }
  )

  res.status(200).json({
    items: items.map((item) => ({
      product_id: item.product_id,
      image_index: item.image_index,
    })),
  })
}

export async function POST(
  req: AuthenticatedMedusaRequest<{
    product_id?: unknown
    image_index?: unknown
    guest_id?: unknown
  }>,
  res: MedusaResponse
): Promise<void> {
  const wishlistModuleService: WishlistModuleService = req.scope.resolve(
    WISHLIST_MODULE
  )

  const productId =
    typeof req.body.product_id === "string" ? req.body.product_id : ""
  const imageIndex = Math.max(1, Math.floor(Number(req.body.image_index) || 1))

  if (!productId) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "product_id is required")
  }

  const customerId = req.auth_context?.actor_id || null
  const guestId =
    !customerId && typeof req.body.guest_id === "string"
      ? req.body.guest_id
      : null

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

  if (!existing.length) {
    await wishlistModuleService.createWishlistItems({
      product_id: productId,
      image_index: imageIndex,
      customer_id: customerId,
      guest_id: customerId ? null : guestId,
    })
  }

  res.status(200).json({ success: true })
}
