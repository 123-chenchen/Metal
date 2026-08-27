import { listProducts } from "@lib/data/products"
import { getRegion } from "@lib/data/regions"
import {
  flattenProductImages,
  FlatProductImageCard,
} from "@lib/util/flatten-product-images"
import { HttpTypes } from "@medusajs/types"
import ProductImageCard from "../product-image-card"

type RelatedProductsProps = {
  product: HttpTypes.StoreProduct
  countryCode: string
  moreDesignCards?: FlatProductImageCard[]
}

export default async function RelatedProducts({
  product,
  countryCode,
  moreDesignCards = [],
}: RelatedProductsProps) {
  const region = await getRegion(countryCode)

  if (!region) {
    return null
  }

  // edit this function to define your related products logic
  const queryParams: HttpTypes.StoreProductListParams = {}
  if (region?.id) {
    queryParams.region_id = region.id
  }
  if (product.collection_id) {
    queryParams.collection_id = [product.collection_id]
  }
  if (product.tags) {
    queryParams.tag_id = product.tags
      .map((t) => t.id)
      .filter(Boolean) as string[]
  }
  queryParams.is_giftcard = false

  const products = await listProducts({
    queryParams,
    countryCode,
  }).then(({ response }) => {
    return response.products.filter(
      (responseProduct) => responseProduct.id !== product.id
    )
  })

  const imageCards = [...moreDesignCards, ...flattenProductImages(products)]

  if (!imageCards.length) {
    return null
  }

  return (
    <div className="product-page-constraint">
      <div className="flex flex-col items-center text-center mb-16">
        <p className="text-xl-regular text-ui-fg-base max-w-lg">
          You might also want to check out these products.
        </p>
      </div>

      <ul className="grid grid-cols-2 small:grid-cols-4 medium:grid-cols-6 gap-x-3 gap-y-6">
        {imageCards.map((card) => (
          <li key={`${card.product.id}-${card.imageIndex}`}>
            <ProductImageCard card={card} region={region} />
          </li>
        ))}
      </ul>
    </div>
  )
}
