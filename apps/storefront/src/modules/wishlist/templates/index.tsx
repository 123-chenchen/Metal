"use client"

import { useEffect, useState } from "react"

import { listProducts } from "@lib/data/products"
import { useWishlist } from "@lib/hooks/use-wishlist"
import { HttpTypes } from "@medusajs/types"
import WishlistProductCard from "../components/wishlist-product-card"

const WishlistTemplate = ({ countryCode }: { countryCode: string }) => {
  const { entries, loaded } = useWishlist()
  const [products, setProducts] = useState<HttpTypes.StoreProduct[]>([])
  const [isFetching, setIsFetching] = useState(true)

  const productIds = Array.from(
    new Set(entries.map((entry) => entry.product_id))
  )

  useEffect(() => {
    if (!loaded) {
      return
    }

    if (!productIds.length) {
      setProducts([])
      setIsFetching(false)
      return
    }

    let cancelled = false
    setIsFetching(true)

    listProducts({
      countryCode,
      queryParams: { id: productIds, limit: productIds.length },
    })
      .then(({ response }) => {
        if (!cancelled) {
          setProducts(response.products)
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsFetching(false)
        }
      })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, productIds.join(","), countryCode])

  const productsById = new Map(products.map((product) => [product.id, product]))

  const cards = entries
    .map((entry) => {
      const product = productsById.get(entry.product_id)
      return product ? { product, imageIndex: entry.image_index } : null
    })
    .filter(
      (card): card is { product: HttpTypes.StoreProduct; imageIndex: number } =>
        !!card
    )

  return (
    <div className="py-6 content-container-wide">
      <div className="mb-8 text-2xl-semi">
        <h1>Wishlist</h1>
      </div>

      {!loaded || isFetching ? (
        <div className="grid grid-cols-2 w-full small:grid-cols-3 medium:grid-cols-5 gap-x-2 gap-y-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="aspect-[1/1] w-full animate-pulse rounded-large bg-ui-bg-subtle"
            />
          ))}
        </div>
      ) : cards.length ? (
        <ul
          className="grid grid-cols-2 w-full small:grid-cols-3 medium:grid-cols-5 gap-x-2 gap-y-4"
          data-testid="wishlist-product-grid"
        >
          {cards.map(({ product, imageIndex }) => (
            <li key={`${product.id}-${imageIndex}`}>
              <WishlistProductCard product={product} imageIndex={imageIndex} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-ui-fg-subtle">
          You haven&apos;t added any products to your wishlist yet.
        </p>
      )}
    </div>
  )
}

export default WishlistTemplate
