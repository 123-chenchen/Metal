import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import {
  deriveFileKey,
  FileModuleWriteService,
  ProductImageRecord,
  ProductImageWriteService,
} from "../lib/product-image-storage"

export type DeleteRemovedProductImagesInput = {
  productIds: string[]
  /**
   * true: only clean up images already soft-deleted from the product (an
   * update removed them from the gallery).
   * false: clean up every image belonging to the given products (the
   * products themselves were deleted).
   */
  onlyDeleted: boolean
}

// The admin dashboard's "make thumbnail" flow can resubmit an image that's
// already saved on the product with a client-generated placeholder id
// instead of its real database id (see @medusajs/dashboard's
// getDefaultValues/normalizeProductFormValues for product media). The
// product module then can't match it to the existing row and inserts a
// second one pointing at the same URL. Collapse those duplicates back down
// to a single row per (product, url) pair, keeping the oldest one.
function findDuplicateImageIds(images: ProductImageRecord[]): string[] {
  const groups = new Map<string, ProductImageRecord[]>()
  for (const image of images) {
    const groupKey = `${image.product_id}:${image.url}`
    const group = groups.get(groupKey)
    if (group) {
      group.push(image)
    } else {
      groups.set(groupKey, [image])
    }
  }

  const duplicateIds: string[] = []
  for (const group of groups.values()) {
    if (group.length < 2) {
      continue
    }
    const sorted = [...group].sort((a, b) => {
      const aTime = a.created_at ? new Date(a.created_at).getTime() : 0
      const bTime = b.created_at ? new Date(b.created_at).getTime() : 0
      return aTime - bTime || a.id.localeCompare(b.id)
    })
    // Keep the oldest row, purge the rest - they refer to the same file.
    duplicateIds.push(...sorted.slice(1).map((image) => image.id))
  }

  return duplicateIds
}

const deleteRemovedProductImagesStep = createStep(
  "delete-removed-product-images",
  async (input: DeleteRemovedProductImagesInput, { container }) => {
    const { productIds, onlyDeleted } = input
    if (!productIds.length) {
      return new StepResponse({ purgedIds: [], deletedKeys: [] })
    }

    const productModuleService = container.resolve(
      Modules.PRODUCT
    ) as unknown as ProductImageWriteService
    const fileModuleService = container.resolve(
      Modules.FILE
    ) as unknown as FileModuleWriteService
    const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

    const filters: Record<string, unknown> = { product_id: productIds }
    if (onlyDeleted) {
      filters.deleted_at = { $ne: null }
    }

    const removedImages = await productModuleService.listProductImages(
      filters,
      { withDeleted: true }
    )

    // Rows still active on the product that duplicate another row's URL -
    // these never got soft-deleted, so they need their own pass.
    let duplicateActiveIds: string[] = []
    if (onlyDeleted) {
      const activeImages = await productModuleService.listProductImages(
        { product_id: productIds },
        { select: ["id", "url", "product_id", "created_at"] }
      )
      duplicateActiveIds = findDuplicateImageIds(activeImages)
    }

    const purgedIds = [
      ...removedImages.map((image) => image.id),
      ...duplicateActiveIds,
    ]

    if (!purgedIds.length) {
      return new StepResponse({ purgedIds: [], deletedKeys: [] })
    }

    // Duplicates are purged from the DB only - their URL is still owned by
    // the row we kept, so the file itself must stay on R2.
    const batchIds = new Set(removedImages.map((image) => image.id))
    const fileBaseUrl = process.env.S3_FILE_URL

    const uniqueUrls = Array.from(
      new Set(removedImages.map((image) => image.url))
    )
    const keysToDelete: string[] = []

    for (const url of uniqueUrls) {
      const fileKey = deriveFileKey(url, fileBaseUrl)
      if (!fileKey) {
        // Not hosted by the configured storage provider (e.g. an external
        // URL) - nothing to remove from Cloudflare R2.
        continue
      }

      // A duplicated product (or a variant referencing the same image) can
      // point multiple active rows at the same R2 object. Only delete the
      // file once nothing outside the current batch still references it.
      const activeImagesWithUrl = await productModuleService.listProductImages({
        url,
      })
      const usedOutsideThisBatch = activeImagesWithUrl.some(
        (image) => !batchIds.has(image.id)
      )
      if (usedOutsideThisBatch) {
        continue
      }

      keysToDelete.push(fileKey)
    }

    if (keysToDelete.length) {
      try {
        await fileModuleService.deleteFiles(keysToDelete)
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        logger.warn(
          `Failed to delete product image file(s) from storage: ${message}`
        )
      }
    }

    await productModuleService.deleteProductImages(purgedIds)

    return new StepResponse({ purgedIds, deletedKeys: keysToDelete })
  }
)

export const deleteRemovedProductImagesWorkflow = createWorkflow(
  "delete-removed-product-images",
  (input: DeleteRemovedProductImagesInput) => {
    const result = deleteRemovedProductImagesStep(input)

    return new WorkflowResponse(result)
  }
)
