import { HttpTypes } from "@medusajs/types"
import ProductImageCard from "@modules/products/components/product-image-card"
import type { FlatProductImageCard } from "@lib/util/flatten-product-images"

type ProductMoreDesignsProps = {
  cards: FlatProductImageCard[]
  region: HttpTypes.StoreRegion
}

export default function ProductMoreDesigns({
  cards,
  region,
}: ProductMoreDesignsProps) {
  if (!cards.length) {
    return null
  }

  return (
    <div className="product-page-constraint">
      <div className="flex flex-col items-center text-center mb-16">
        <span className="text-base-regular text-ui-fg-subtle mb-6">
          More designs
        </span>
        <p className="text-2xl-regular text-ui-fg-base max-w-lg">
          Other designs available for this product.
        </p>
      </div>

      <ul className="grid grid-cols-2 small:grid-cols-4 medium:grid-cols-6 gap-x-3 gap-y-6">
        {cards.map((card) => (
          <li key={`${card.product.id}-${card.imageIndex}`}>
            <ProductImageCard card={card} region={region} />
          </li>
        ))}
      </ul>
    </div>
  )
}
