import React, { Suspense } from "react"

import ImageGallery, {
  GalleryImage,
} from "@modules/products/components/image-gallery"
import ProductActions from "@modules/products/components/product-actions"
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

  // The other designs/images of this product surface as their own cards in
  // "You might also want to check out these products" below, so the PDP
  // gallery itself only ever needs to show the one currently selected image.
  const galleryImages = images.filter((image) => image.id === activeImageId)

  return (
    <>
      <div
        className="content-container flex flex-col gap-y-8 py-6"
        data-testid="product-container"
      >
        <Breadcrumb product={product} />

        <div className="flex flex-col small:flex-row small:items-start gap-8">
          <div className="w-full small:w-1/2">
            <ImageGallery
              images={galleryImages}
              activeId={activeImageId}
              productHandle={product.handle ?? ""}
            />
          </div>

          <div className="flex w-full small:w-1/2 flex-col gap-y-6">
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
            <ProductTabs product={product} />
          </div>
        </div>
      </div>
      <div
        className="content-container my-16 small:my-32"
        data-testid="related-products-container"
      >
        <Suspense fallback={<SkeletonRelatedProducts />}>
          <RelatedProducts
            product={product}
            countryCode={countryCode}
            moreDesignCards={moreDesignCards}
          />
        </Suspense>
      </div>
    </>
  )
}

export default ProductTemplate
