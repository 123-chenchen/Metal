import { HttpTypes } from "@medusajs/types"

export type FlatProductImageCard = {
  product: HttpTypes.StoreProduct
  image: HttpTypes.StoreProductImage
  imageIndex: number // 1-based, matches the design name suffix
  designName: string
}

// The design a customer picked (from a listing card, or the default when
// they land on a product page directly) — threaded through the PDP into
// the Add to Cart metadata.
export type SelectedImage = {
  url: string
  index: number // 1-based
  designName: string
}

export function flattenProductImages(
  products: HttpTypes.StoreProduct[]
): FlatProductImageCard[] {
  return products.flatMap((product) => {
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
