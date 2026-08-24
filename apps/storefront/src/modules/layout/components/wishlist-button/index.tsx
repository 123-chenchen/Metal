"use client"

import { useWishlist } from "@lib/hooks/use-wishlist"
import Heart from "@modules/common/icons/heart"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

const WishlistButton = () => {
  const { entries } = useWishlist()

  return (
    <LocalizedClientLink
      className="relative flex items-center hover:text-metal-gold transition-colors"
      href="/wishlist"
      data-testid="nav-wishlist-link"
    >
      <Heart size="20" />
      {entries.length > 0 && (
        <span className="absolute -top-2 -right-2.5 w-4 h-4 bg-metal-gold text-metal-black text-[10px] font-bold font-mono-brand flex items-center justify-center">
          {entries.length}
        </span>
      )}
      <span className="sr-only">{`Wishlist (${entries.length})`}</span>
    </LocalizedClientLink>
  )
}

export default WishlistButton
