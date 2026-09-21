import { HttpTypes } from "@medusajs/types"
import { productDesigns, ProductDesign } from "./designs"

export type FlatProductImageCard = {
  product: HttpTypes.StoreProduct
  image: HttpTypes.StoreProductImage
  imageIndex: number // 1-based, matches the design name suffix
  designName: string
  design?: ProductDesign
}

// The design a customer picked (from a listing card, or the default when
// they land on a product page directly) — threaded through the PDP into
// the Add to Cart metadata.
export type SelectedImage = {
  designId?: string
  url: string
  index: number // 1-based
  designName: string
}

export function flattenProductImages(
  products: HttpTypes.StoreProduct[]
): FlatProductImageCard[] {
  return products.flatMap((product) => {
    const designs = productDesigns(product)
    if (designs.length) {
      return designs.filter((design) => design.active && !design.archived)
        .sort((a, b) => a.sequence - b.sequence)
        .map((design) => ({
          product,
          image: { id: design.id, url: design.artwork_url } as HttpTypes.StoreProductImage,
          imageIndex: design.sequence,
          designName: design.title,
          design,
        }))
    }
    const images = product.images?.length
      ? product.images
      : product.thumbnail
      ? [{ id: product.id, url: product.thumbnail } as HttpTypes.StoreProductImage]
      : []

    return images.map((image, index) => {
      const imageIndex = index + 1

      return {
        product,
        image,
        imageIndex,
        designName: `${product.title} ${imageIndex}`,
      }
    })
  })
}
