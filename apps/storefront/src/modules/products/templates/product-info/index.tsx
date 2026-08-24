import { HttpTypes } from "@medusajs/types"
import { Heading, Text } from "@modules/common/components/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

type ProductInfoProps = {
  product: HttpTypes.StoreProduct
}

export const Breadcrumb = ({ product }: ProductInfoProps) => {
  return (
    <nav
      className="flex items-center gap-x-2 font-mono text-sm uppercase tracking-wide text-ui-fg-muted"
      aria-label="Breadcrumb"
    >
      <LocalizedClientLink href="/" className="hover:text-ui-fg-interactive">
        Home
      </LocalizedClientLink>
      <span>/</span>
      {product.collection && (
        <>
          <LocalizedClientLink
            href={`/collections/${product.collection.handle}`}
            className="hover:text-ui-fg-interactive"
          >
            {product.collection.title}
          </LocalizedClientLink>
          <span>/</span>
        </>
      )}
      <span className="text-ui-fg-interactive truncate">{product.title}</span>
    </nav>
  )
}

const ProductInfo = ({ product }: ProductInfoProps) => {
  return (
    <div id="product-info" className="flex flex-col gap-y-4">
      <Heading
        level="h2"
        className="text-4xl small:text-5xl font-bold leading-[1.05] text-ui-fg-base"
        data-testid="product-title"
      >
        {product.title}
      </Heading>

      {product.description && (
        <Text
          className="text-base small:text-lg text-ui-fg-subtle whitespace-pre-line"
          data-testid="product-description"
        >
          {product.description}
        </Text>
      )}
    </div>
  )
}

export default ProductInfo
