import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Thumbnail from "@modules/products/components/thumbnail"
import WishlistToggleButton from "@modules/common/components/wishlist-toggle-button"
import type { FlatProductImageCard } from "@lib/util/flatten-product-images"

export default async function ProductImageCard({
  card,
  region: _region,
}: {
  card: FlatProductImageCard
  region: HttpTypes.StoreRegion
}) {
  const { product, image, imageIndex, designName } = card

  return (
    <LocalizedClientLink
      href={`/products/${product.handle}?img=${imageIndex}`}
      className="group block"
    >
      <div className="relative" data-testid="product-image-card-wrapper">
        <WishlistToggleButton
          productId={product.id}
          imageIndex={imageIndex}
          className="absolute right-2 top-2 z-10"
        />
        <Thumbnail thumbnail={image.url} size="auto" bare />
        <p
          className="mt-2 truncate txt-compact-medium text-ui-fg-subtle"
          data-testid="product-title"
        >
          {designName}
        </p>
      </div>
    </LocalizedClientLink>
  )
}
