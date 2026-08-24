"use client"

import { useState } from "react"

import { useWishlist } from "@lib/hooks/use-wishlist"
import { getProductPrice } from "@lib/util/get-product-price"
import { HttpTypes } from "@medusajs/types"
import { Text, clx } from "@modules/common/components/ui"
import Heart from "@modules/common/icons/heart"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Thumbnail from "@modules/products/components/thumbnail"

const WishlistProductCard = ({
  product,
  imageIndex,
}: {
  product: HttpTypes.StoreProduct
  imageIndex: number
}) => {
  const { remove } = useWishlist()
  const [isRemoving, setIsRemoving] = useState(false)
  const { cheapestPrice } = getProductPrice({ product })

  const image =
    product.images?.[imageIndex - 1]?.url ?? product.thumbnail ?? undefined
  const designName = `${product.title} ${imageIndex}`

  const handleRemove = async (event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    setIsRemoving(true)
    try {
      await remove(product.id, imageIndex)
    } catch {
      setIsRemoving(false)
    }
  }

  return (
    <LocalizedClientLink
      href={`/products/${product.handle}?img=${imageIndex}`}
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
      <Thumbnail thumbnail={image} size="square" />
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
