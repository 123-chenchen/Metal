import { listProducts } from "@lib/data/products"
import { SelectedImage } from "@lib/util/flatten-product-images"
import { HttpTypes } from "@medusajs/types"
import ProductActions from "@modules/products/components/product-actions"

/**
 * Fetches real time pricing for a product and renders the product actions component.
 */
export default async function ProductActionsWrapper({
  id,
  region,
  selectedImage,
}: {
  id: string
  region: HttpTypes.StoreRegion
  selectedImage: SelectedImage | null
}) {
  const product = await listProducts({
    queryParams: { id: [id] },
    regionId: region.id,
  }).then(({ response }) => response.products[0])

  if (!product) {
    return null
  }

  return (
    <ProductActions
      product={product}
      region={region}
      selectedImage={selectedImage}
    />
  )
}
