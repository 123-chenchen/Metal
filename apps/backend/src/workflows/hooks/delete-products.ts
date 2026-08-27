import { deleteProductsWorkflow } from "@medusajs/medusa/core-flows"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { deleteRemovedProductImagesWorkflow } from "../delete-removed-product-images"
import { removeDeletedProductReferencesWorkflow } from "../remove-deleted-product-references"

deleteProductsWorkflow.hooks.productsDeleted(
  async ({ ids }, { container }) => {
    if (!ids?.length) {
      return
    }

    try {
      await deleteRemovedProductImagesWorkflow(container).run({
        input: { productIds: ids, onlyDeleted: false },
      })
    } catch (error) {
      const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
      const message = error instanceof Error ? error.message : String(error)
      logger.warn(`Failed to clean up deleted product images: ${message}`)
    }

    try {
      await removeDeletedProductReferencesWorkflow(container).run({
        input: { productIds: ids },
      })
    } catch (error) {
      const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
      const message = error instanceof Error ? error.message : String(error)
      logger.warn(
        `Failed to remove deleted product references from wishlists/carts: ${message}`
      )
    }
  }
)
