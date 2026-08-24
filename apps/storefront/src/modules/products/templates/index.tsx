import React, { Suspense } from "react"

import ImageGallery, {
  GalleryImage,
} from "@modules/products/components/image-gallery"
import ProductActions from "@modules/products/components/product-actions"
import ProductMoreDesigns from "@modules/products/components/product-more-designs"
import ProductOnboardingCta from "@modules/products/components/product-onboarding-cta"
import ProductTabs from "@modules/products/components/product-tabs"
import RelatedProducts from "@modules/products/components/related-products"
import ProductInfo, { Breadcrumb } from "@modules/products/templates/product-info"
import FreeShippingPriceNudge from "@modules/shipping/components/free-shipping-price-nudge"
import SkeletonRelatedProducts from "@modules/skeletons/templates/skeleton-related-products"
import { notFound } from "next/navigation"
import { HttpTypes, StoreCartShippingOption } from "@medusajs/types"
import { flattenProductImages, SelectedImage } from "@lib/util/flatten-product-images"

import ProductActionsWrapper from "./product-actions-wrapper"

type ProductTemplateProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  countryCode: string
  images: GalleryImage[]
  selectedImage: SelectedImage | null
  cart: HttpTypes.StoreCart | null
  shippingOptions: StoreCartShippingOption[]
}

const ProductTemplate: React.FC<ProductTemplateProps> = ({
  product,
  region,
  countryCode,
  images,
  selectedImage,
  cart,
  shippingOptions,
}) => {
  if (!product || !product.id) {
    return notFound()
  }

  const moreDesignCards = flattenProductImages([product]).filter(
    (card) => card.imageIndex !== selectedImage?.index
  )

  const activeImageId =
    images.find((image) => image.index === selectedImage?.index)?.id ??
    images[0]?.id ??
    null

  return (
    <>
      <div
        className="content-container flex flex-col gap-y-8 py-6"
        data-testid="product-container"
      >
        <Breadcrumb product={product} />

        <div className="flex flex-col small:flex-row small:items-start gap-8">
          <div className="w-full small:w-3/5">
            <ImageGallery
              images={images}
              activeId={activeImageId}
              productHandle={product.handle ?? ""}
            />
          </div>

          <div className="flex w-full small:w-2/5 flex-col gap-y-6">
            <ProductOnboardingCta />
            <ProductInfo product={product} />
            <Suspense
              fallback={
                <ProductActions
                  disabled={true}
                  product={product}
                  region={region}
                  selectedImage={selectedImage}
                />
              }
            >
              <ProductActionsWrapper
                id={product.id}
                region={region}
                selectedImage={selectedImage}
              />
            </Suspense>
            {cart && (
              <FreeShippingPriceNudge
                variant="inline"
                cart={cart}
                shippingOptions={shippingOptions}
              />
            )}
          </div>
        </div>

        <div className="w-full small:max-w-[640px]">
          <ProductTabs product={product} />
        </div>
      </div>
      <div className="content-container my-16 small:my-32">
        <ProductMoreDesigns cards={moreDesignCards} region={region} />
      </div>
      <div
        className="content-container my-16 small:my-32"
        data-testid="related-products-container"
      >
        <Suspense fallback={<SkeletonRelatedProducts />}>
          <RelatedProducts product={product} countryCode={countryCode} />
        </Suspense>
      </div>
    </>
  )
}

export default ProductTemplate
