"use client"

import { useState } from "react"

import { useWishlist } from "@lib/hooks/use-wishlist"
import { clx } from "@modules/common/components/ui"
import Heart from "@modules/common/icons/heart"

const WishlistToggleButton = ({
  productId,
  imageIndex,
  className,
}: {
  productId: string
  imageIndex: number
  className?: string
}) => {
  const { isWishlisted, toggle } = useWishlist()
  const [isToggling, setIsToggling] = useState(false)
  const active = isWishlisted(productId, imageIndex)

  const handleClick = async (event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    setIsToggling(true)
    try {
      await toggle(productId, imageIndex)
    } finally {
      setIsToggling(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isToggling}
      aria-pressed={active}
      aria-label={active ? "Remove from wishlist" : "Add to wishlist"}
      className={clx(
        "flex h-8 w-8 items-center justify-center bg-ui-bg-base/90 shadow-md transition-colors hover:bg-ui-bg-base disabled:pointer-events-none disabled:opacity-50",
        className
      )}
    >
      <Heart
        size="16"
        color={active ? "#ff5b5b" : "currentColor"}
        className={clx(!active && "text-ui-fg-muted")}
        {...(active ? { fill: "#ff5b5b" } : {})}
      />
    </button>
  )
}

export default WishlistToggleButton
