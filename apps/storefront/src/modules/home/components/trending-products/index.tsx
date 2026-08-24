import { listProducts } from "@lib/data/products"
import { getProductPrice } from "@lib/util/get-product-price"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Thumbnail from "@modules/products/components/thumbnail"

const ProductCard = ({ product }: { product: HttpTypes.StoreProduct }) => {
  const { cheapestPrice } = getProductPrice({ product })
  const onSale = cheapestPrice?.price_type === "sale"

  return (
    <LocalizedClientLink href={`/products/${product.handle}`} className="group flex flex-col gap-3.5">
      <div className="relative overflow-hidden bg-metal-panel-2">
        {onSale && (
          <span className="absolute left-3 top-3 z-10 bg-metal-black/75 px-2.5 py-1 font-mono-brand text-[10.5px] font-bold uppercase tracking-wide text-metal-gold">
            -{cheapestPrice?.percentage_diff}%
          </span>
        )}
        <Thumbnail
          thumbnail={product.thumbnail}
          images={product.images}
          size="full"
          isFeatured
          bare
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <h4 className="text-sm font-semibold leading-snug text-metal-cream">
          {product.title}
        </h4>
        {cheapestPrice && (
          <div className="flex items-center gap-2.5 font-mono-brand">
            <span className="text-sm font-bold text-metal-gold">
              {cheapestPrice.calculated_price}
            </span>
            {onSale && (
              <span className="text-xs text-metal-gray line-through">
                {cheapestPrice.original_price}
              </span>
            )}
          </div>
        )}
      </div>
    </LocalizedClientLink>
  )
}

const TrendingProducts = async ({ region }: { region: HttpTypes.StoreRegion }) => {
  const {
    response: { products },
  } = await listProducts({
    regionId: region.id,
    queryParams: {
      limit: 4,
      order: "-created_at",
      fields: "*variants.calculated_price",
    },
  })

  if (!products.length) {
    return null
  }

  return (
    <div className="content-container bg-metal-black pb-16 small:pb-24">
      <div className="mb-9 flex items-end justify-between">
        <div>
          <span className="font-mono-brand text-xs font-bold uppercase tracking-wide text-metal-gold">
            Fresh drops
          </span>
          <h2 className="mt-2.5 font-display text-3xl tracking-wide text-metal-cream">
            Trending Now
          </h2>
        </div>
        <LocalizedClientLink
          href="/store"
          className="flex items-center gap-2 pb-1.5 font-mono-brand text-xs font-semibold tracking-wide text-metal-gold"
        >
          View all
          <svg
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-3.5 w-3.5"
          >
            <path d="M4 10h11M11 5l5 5-5 5" />
          </svg>
        </LocalizedClientLink>
      </div>
      <div className="grid grid-cols-2 gap-6 small:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  )
}

export default TrendingProducts
