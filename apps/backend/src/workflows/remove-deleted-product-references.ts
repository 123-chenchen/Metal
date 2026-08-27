import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { Modules } from "@medusajs/framework/utils"
import { WISHLIST_MODULE } from "../modules/wishlist"
import WishlistModuleService from "../modules/wishlist/service"

export type RemoveDeletedProductReferencesInput = {
  productIds: string[]
}

// Wishlist items and cart line items keep a plain product_id snapshot
// rather than a hard foreign key, so deleting a product leaves them
// dangling. An orphaned cart line item in particular breaks the cart's
// pricing/totals calculation for *every* item in it - including new ones a
// customer is trying to add - so it must be cleaned up as soon as the
// product is gone.
const removeDeletedProductReferencesStep = createStep(
  "remove-deleted-product-references",
  async (input: RemoveDeletedProductReferencesInput, { container }) => {
    const { productIds } = input
    if (!productIds.length) {
      return new StepResponse({ removedWishlistItemIds: [], removedLineItemIds: [] })
    }

    const wishlistModuleService: WishlistModuleService = container.resolve(
      WISHLIST_MODULE
    )
    const cartModuleService = container.resolve(Modules.CART)

    const [wishlistItems, lineItems] = await Promise.all([
      wishlistModuleService.listWishlistItems({ product_id: productIds }),
      cartModuleService.listLineItems({ product_id: productIds }),
    ])

    const removedWishlistItemIds = wishlistItems.map((item) => item.id)
    const removedLineItemIds = lineItems.map((item) => item.id)

    await Promise.all([
      removedWishlistItemIds.length
        ? wishlistModuleService.deleteWishlistItems(removedWishlistItemIds)
        : Promise.resolve(),
      removedLineItemIds.length
        ? cartModuleService.deleteLineItems(removedLineItemIds)
        : Promise.resolve(),
    ])

    return new StepResponse({ removedWishlistItemIds, removedLineItemIds })
  }
)

export const removeDeletedProductReferencesWorkflow = createWorkflow(
  "remove-deleted-product-references",
  (input: RemoveDeletedProductReferencesInput) => {
    const result = removeDeletedProductReferencesStep(input)

    return new WorkflowResponse(result)
  }
)
