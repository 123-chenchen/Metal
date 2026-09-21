import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { manageDesignsWorkflow } from "../workflows/manage-designs"
import { DESIGN_MODULE } from "../modules/design"
import DesignModuleService from "../modules/design/service"
import { WISHLIST_MODULE } from "../modules/wishlist"
import WishlistModuleService from "../modules/wishlist/service"

export default async function migrateProductDesigns({ container }: ExecArgs) {
  const products = container.resolve(Modules.PRODUCT)
  const designs = container.resolve<DesignModuleService>(DESIGN_MODULE)
  const wishlist = container.resolve<WishlistModuleService>(WISHLIST_MODULE)
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  let migrated = 0
  for (let skip = 0; ; skip += 100) {
    const batch = await products.listProducts({}, { take: 100, skip, order: { id: "ASC" } })
    if (!batch.length) break
    for (const product of batch) {
      if (product.handle?.startsWith("custom-") || product.handle === "hexagon-metal-posters") continue
      await manageDesignsWorkflow(container).run({ input: { product_id: product.id, command: { action: "import" } } })
      const records = await designs.listDesigns({ product_id: product.id }, { take: null })
      const entries = await wishlist.listWishlistItems({ product_id: product.id, design_id: null }, { take: null })
      for (const entry of entries) {
        const design = records.find((record) => record.legacy_index === entry.image_index)
        if (design) await wishlist.updateWishlistItems({ id: entry.id, design_id: design.id })
        else logger.warn(`Unresolved wishlist mapping: ${entry.id}`)
      }
      migrated += records.length
    }
  }
  logger.info(`Product designs migration complete: ${migrated} designs. Existing names and legacy indices retained.`)
}
