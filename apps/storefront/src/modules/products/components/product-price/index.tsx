import { clx } from "@modules/common/components/ui"

import { getProductPrice } from "@lib/util/get-product-price"
import { HttpTypes } from "@medusajs/types"

export default function ProductPrice({
  product,
  variant,
}: {
  product: HttpTypes.StoreProduct
  variant?: HttpTypes.StoreProductVariant
}) {
  const { cheapestPrice, variantPrice } = getProductPrice({
    product,
    variantId: variant?.id,
  })

  const selectedPrice = variant ? variantPrice : cheapestPrice

  if (!selectedPrice) {
    return <div className="block w-32 h-9 bg-ui-bg-component animate-pulse" />
  }

  const isSale = selectedPrice.price_type === "sale"

  return (
    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
      <span
        className={clx("font-mono text-5xl font-bold", {
          "text-ui-fg-interactive": isSale,
          "text-ui-fg-base": !isSale,
        })}
      >
        {!variant && (
          <span className="mr-1 text-lg font-normal text-ui-fg-subtle">
            From
          </span>
        )}
        <span
          data-testid="product-price"
          data-value={selectedPrice.calculated_price_number}
        >
          {selectedPrice.calculated_price}
        </span>
      </span>
      {isSale && (
        <>
          <span
            className="text-lg text-ui-fg-muted line-through"
            data-testid="original-product-price"
            data-value={selectedPrice.original_price_number}
          >
            {selectedPrice.original_price}
          </span>
          <span className="rounded-base bg-ui-tag-orange-bg px-2.5 py-1 text-sm font-semibold text-ui-tag-orange-text">
            -{selectedPrice.percentage_diff}%
          </span>
        </>
      )}
    </div>
  )
}
