"use client"

import { addToCart } from "@lib/data/cart"
import { useIntersection } from "@lib/hooks/use-in-view"
import { useWishlist } from "@lib/hooks/use-wishlist"
import { SelectedImage } from "@lib/util/flatten-product-images"
import { HttpTypes } from "@medusajs/types"
import { Button, clx } from "@modules/common/components/ui"
import Divider from "@modules/common/components/divider"
import ErrorMessage from "@modules/checkout/components/error-message"
import Heart from "@modules/common/icons/heart"
import OptionSelect from "@modules/products/components/product-actions/option-select"
import { isEqual } from "lodash"
import { useParams, usePathname, useSearchParams } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"
import ProductPrice from "../product-price"
import MobileActions from "./mobile-actions"
import { useRouter } from "next/navigation"

type ProductActionsProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  disabled?: boolean
  selectedImage?: SelectedImage | null
}

const optionsAsKeymap = (
  variantOptions: HttpTypes.StoreProductVariant["options"]
) => {
  return variantOptions?.reduce((acc: Record<string, string>, varopt) => {
    if (varopt.option_id) acc[varopt.option_id] = varopt.value
    return acc
  }, {})
}

export default function ProductActions({
  product,
  disabled,
  selectedImage,
}: ProductActionsProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [options, setOptions] = useState<Record<string, string | undefined>>({})
  const [isAdding, setIsAdding] = useState(false)
  const [isBuyingNow, setIsBuyingNow] = useState(false)
  const [isTogglingWishlist, setIsTogglingWishlist] = useState(false)
  const [cartError, setCartError] = useState<string | null>(null)
  const { isWishlisted: checkWishlisted, toggle: toggleWishlist } =
    useWishlist()
  const wishlistImageIndex = selectedImage?.index ?? 1
  const isWishlisted = checkWishlisted(product.id, wishlistImageIndex)
  const countryCode = useParams().countryCode as string

  // If there is only 1 variant, preselect the options
  useEffect(() => {
    if (product.variants?.length === 1) {
      const variantOptions = optionsAsKeymap(product.variants[0].options)
      setOptions(variantOptions ?? {})
    }
  }, [product.variants])

  const selectedVariant = useMemo(() => {
    if (!product.variants || product.variants.length === 0) {
      return
    }

    return product.variants.find((v) => {
      const variantOptions = optionsAsKeymap(v.options)
      return isEqual(variantOptions, options)
    })
  }, [product.variants, options])

  // update the options when a variant is selected
  const setOptionValue = (optionId: string, value: string) => {
    setOptions((prev) => ({
      ...prev,
      [optionId]: value,
    }))
  }

  //check if the selected options produce a valid variant
  const isValidVariant = useMemo(() => {
    return product.variants?.some((v) => {
      const variantOptions = optionsAsKeymap(v.options)
      return isEqual(variantOptions, options)
    })
  }, [product.variants, options])

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    const value = isValidVariant ? selectedVariant?.id : null

    if (params.get("v_id") === value) {
      return
    }

    if (value) {
      params.set("v_id", value)
    } else {
      params.delete("v_id")
    }

    router.replace(pathname + "?" + params.toString())
  }, [selectedVariant, isValidVariant])

  const actionsRef = useRef<HTMLDivElement>(null)

  const inView = useIntersection(actionsRef, "0px")

  const addSelectedVariantToCart = async () => {
    if (!selectedVariant?.id) return false

    const image = selectedImage ?? {
      url: product.thumbnail ?? product.images?.[0]?.url ?? "",
      index: 1,
      designName: `${product.title} 1`,
    }

    await addToCart({
      variantId: selectedVariant.id,
      quantity: 1,
      countryCode,
      metadata: {
        selected_image_url: image.url,
        selected_image_index: image.index,
        selected_design_name: image.designName,
      },
    })

    return true
  }

  // add the selected variant to the cart
  const handleAddToCart = async () => {
    setIsAdding(true)
    setCartError(null)
    try {
      await addSelectedVariantToCart()
    } catch (err) {
      setCartError(err instanceof Error ? err.message : "Failed to add to cart")
    } finally {
      setIsAdding(false)
    }
  }

  // add the selected variant to the cart and jump straight to checkout
  const handleBuyNow = async () => {
    setIsBuyingNow(true)
    setCartError(null)
    try {
      const added = await addSelectedVariantToCart()
      if (added) {
        router.push(`/${countryCode}/checkout?step=address`)
        return
      }
    } catch (err) {
      setCartError(err instanceof Error ? err.message : "Failed to add to cart")
    } finally {
      setIsBuyingNow(false)
    }
  }

  return (
    <>
      <div className="flex flex-col gap-y-2" ref={actionsRef}>
        <div>
          {(product.variants?.length ?? 0) > 1 && (
            <div className="flex flex-col gap-y-4">
              {(product.options || []).map((option) => {
                return (
                  <div key={option.id}>
                    <OptionSelect
                      option={option}
                      current={options[option.id]}
                      updateOption={setOptionValue}
                      title={option.title ?? ""}
                      data-testid="product-options"
                      disabled={!!disabled || isAdding}
                    />
                  </div>
                )
              })}
              <Divider />
            </div>
          )}
        </div>

        <ProductPrice product={product} variant={selectedVariant} />

        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={
              !selectedVariant || !!disabled || isAdding || !isValidVariant
            }
            className="flex-1 h-16 rounded-base border border-ui-fg-interactive text-lg font-bold text-ui-fg-interactive transition-colors hover:bg-ui-button-inverted hover:text-ui-fg-on-inverted disabled:pointer-events-none disabled:opacity-50"
            data-testid="add-product-button"
          >
            {isAdding
              ? "Adding..."
              : !selectedVariant
              ? "Select a size"
              : "Add to cart"}
          </button>
          <button
            type="button"
            onClick={async () => {
              setIsTogglingWishlist(true)
              try {
                await toggleWishlist(product.id, wishlistImageIndex)
              } finally {
                setIsTogglingWishlist(false)
              }
            }}
            disabled={isTogglingWishlist}
            aria-pressed={isWishlisted}
            aria-label={
              isWishlisted ? "Remove from wishlist" : "Add to wishlist"
            }
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-base border border-ui-border-base transition-colors hover:border-ui-fg-interactive disabled:pointer-events-none disabled:opacity-50"
          >
            <Heart
              size="22"
              color={isWishlisted ? "#ff5b5b" : "currentColor"}
              className={clx(!isWishlisted && "text-ui-fg-muted")}
              {...(isWishlisted ? { fill: "#ff5b5b" } : {})}
            />
          </button>
        </div>

        <ErrorMessage error={cartError} data-testid="add-to-cart-error-message" />

        <Button
          onClick={handleBuyNow}
          disabled={
            !selectedVariant || !!disabled || isBuyingNow || !isValidVariant
          }
          variant="primary"
          className="w-full h-16 text-lg font-bold"
          isLoading={isBuyingNow}
          data-testid="buy-now-button"
        >
          Buy now
        </Button>
        <MobileActions
          product={product}
          variant={selectedVariant}
          options={options}
          updateOptions={setOptionValue}
          handleAddToCart={handleAddToCart}
          isAdding={isAdding}
          show={!inView}
          optionsDisabled={!!disabled || isAdding}
        />
      </div>
    </>
  )
}
