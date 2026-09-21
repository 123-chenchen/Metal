import { MedusaContainer } from "@medusajs/framework/types"
import { MedusaError, Modules } from "@medusajs/framework/utils"
import { DESIGN_MODULE } from "../modules/design"
import DesignModuleService from "../modules/design/service"

export async function resolveCartDesign(scope: MedusaContainer, variantId: string, metadata: Record<string, unknown>) {
  const products = scope.resolve(Modules.PRODUCT)
  const variant = await products.retrieveProductVariant(variantId)
  const service = scope.resolve<DesignModuleService>(DESIGN_MODULE)
  const requestedId = typeof metadata.selected_design_id === "string" ? metadata.selected_design_id : ""
  const designs = await service.listDesigns({ product_id: variant.product_id! }, { take: null })
  if (!designs.length && !requestedId) return metadata
  const design = requestedId
    ? designs.find((item) => item.id === requestedId)
    : designs.find((item) => item.legacy_index === Number(metadata.selected_image_index))
  if (!design || !design.active || design.archived) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "The selected design is unavailable or does not belong to this product")
  }
  return {
    selected_design_id: design.id,
    selected_design_name: design.title,
    selected_image_url: design.artwork_url,
    selected_image_index: design.sequence,
    selected_design_shape: design.shape,
    selected_design_crop: design.crop,
    selected_design_version: design.version,
    selected_product_id: design.product_id,
  }
}
