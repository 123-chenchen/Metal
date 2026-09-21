"use client"

import { useState } from "react"

import { useWishlist } from "@lib/hooks/use-wishlist"
import { getProductPrice } from "@lib/util/get-product-price"
import { HttpTypes } from "@medusajs/types"
import { Text, clx } from "@modules/common/components/ui"
import Heart from "@modules/common/icons/heart"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Thumbnail from "@modules/products/components/thumbnail"
import DesignArtwork from "@modules/products/components/design-artwork"
import { productDesigns, designHref } from "@lib/util/designs"

const WishlistProductCard = ({
  product,
  imageIndex,
  designId,
}: {
  product: HttpTypes.StoreProduct
  imageIndex: number
  designId?: string
}) => {
  const { remove } = useWishlist()
  const [isRemoving, setIsRemoving] = useState(false)
  const { cheapestPrice } = getProductPrice({ product })

  const design = productDesigns(product).find((item) => designId ? item.id === designId : item.legacy_index === imageIndex)
  const image = design?.artwork_url ?? product.images?.[imageIndex - 1]?.url ?? product.thumbnail ?? undefined
  const designName = design?.title ?? `${product.title} ${imageIndex}`

  const handleRemove = async (event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    setIsRemoving(true)
    try {
      await remove(product.id, imageIndex, designId)
    } catch {
      setIsRemoving(false)
    }
  }

  return (
    <LocalizedClientLink
      href={designHref(product, design?.id, imageIndex)}
      className={clx("group relative block", isRemoving && "opacity-40")}
    >
      <button
        type="button"
        onClick={handleRemove}
        disabled={isRemoving}
        aria-label="Remove from wishlist"
        className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center bg-ui-bg-base/90 shadow-md transition-colors hover:bg-ui-bg-base disabled:pointer-events-none"
      >
        <Heart size="16" color="#ff5b5b" fill="#ff5b5b" />
      </button>
      <div className="aspect-[4/5] flex items-center justify-center bg-ui-bg-subtle p-3">
        {image ? <DesignArtwork url={image} title={designName} design={design} /> : <Thumbnail size="square" />}
      </div>
      <div className="flex txt-compact-medium mt-4 justify-between">
        <Text className="text-ui-fg-subtle" data-testid="product-title">
          {designName}
        </Text>
        {cheapestPrice && (
          <Text className="text-ui-fg-muted">
            {cheapestPrice.calculated_price}
          </Text>
        )}
      </div>
    </LocalizedClientLink>
  )
}

export default WishlistProductCard
