import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import DesignArtwork from "@modules/products/components/design-artwork"
import { designHref } from "@lib/util/designs"
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
      href={designHref(product, card.design?.id, imageIndex)}
      className="group block"
    >
      <div className="relative" data-testid="product-image-card-wrapper">
        <WishlistToggleButton
          productId={product.id}
          imageIndex={imageIndex}
          designId={card.design?.id}
          className="absolute right-2 top-2 z-10"
        />
        <div className="aspect-[4/5] w-full bg-ui-bg-subtle p-3 flex items-center justify-center overflow-hidden">
          <DesignArtwork url={image.url} title={designName} design={card.design} />
        </div>
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
