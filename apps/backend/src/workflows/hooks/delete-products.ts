import { deleteProductsWorkflow } from "@medusajs/medusa/core-flows"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { deleteRemovedProductImagesWorkflow } from "../delete-removed-product-images"

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
  }
)
