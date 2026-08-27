"use client"

import { uploadCustomImage } from "@lib/client/custom-poster"
import type { CustomCartItemInput } from "@lib/data/custom-poster"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Button, clx } from "@modules/common/components/ui"
import ProductPrice from "@modules/products/components/product-price"
import HexagonProduct3DView from "@modules/custom/components/hexagon-3d-view"
import OptionSelect from "@modules/products/components/product-actions/option-select"
import {
  buildCropImageStyle,
  clampCrop,
  CustomCrop,
  CustomCropModal,
  CustomUploadDraft,
  getDefaultCrop,
} from "@modules/custom/components/crop"
import { isEqual } from "lodash"
import { useRouter } from "next/navigation"
import { ChangeEvent, useEffect, useMemo, useState, useTransition } from "react"

type UploadedCustomImage = {
  id: string
  // Local blob preview - always present, never touches cloud storage.
  imageUrl: string
  // Set only once this image has actually been uploaded to cloud storage,
  // which happens lazily at "Add to cart" time rather than at crop-confirm,
  // so previewing/demoing designs never writes to storage.
  remoteUrl?: string
  file: File
  filename: string
  crop: CustomCrop
}

type HexagonCustomTemplateProps = {
  product: HttpTypes.StoreProduct
  countryCode: string
  addItemsToCartAction: AddItemsToCartAction
}

type AddItemsToCartAction = (input: {
  items: CustomCartItemInput[]
  countryCode: string
}) => Promise<void>

const HEX_CLIP_PATH =
  "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)"
const PREVIEW_HEX_WIDTH = 510
const PREVIEW_HEX_HEIGHT = 594
// Mirrors the backend's own cap (apps/backend/src/api/store/custom/uploads/route.ts)
// so oversized files are rejected here instead of tripping the JSON body-size
// limit server-side, whose error response the browser can't surface (no CORS
// headers on that path), leaving the upload looking stuck forever.
const MAX_CUSTOM_IMAGE_BYTES = 8 * 1024 * 1024

const optionsAsKeymap = (
  variantOptions: HttpTypes.StoreProductVariant["options"]
) => {
  return variantOptions?.reduce((acc: Record<string, string>, varopt) => {
    if (varopt.option_id) acc[varopt.option_id] = varopt.value
    return acc
  }, {})
}

const HexagonCustomTemplate = ({
  product,
  countryCode,
  addItemsToCartAction,
}: HexagonCustomTemplateProps) => {
  const router = useRouter()
  const [images, setImages] = useState<UploadedCustomImage[]>([])
  const [activeImageId, setActiveImageId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<"photo" | "spin">("photo")
  const [draft, setDraft] = useState<CustomUploadDraft | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [selectedOptions, setSelectedOptions] = useState<
    Record<string, string | undefined>
  >({})

  useEffect(() => {
    if (product.variants?.length === 1) {
      setSelectedOptions(optionsAsKeymap(product.variants[0].options) ?? {})
    }
  }, [product.variants])

  const selectedVariant = useMemo(() => {
    return product.variants?.find((variant) =>
      isEqual(optionsAsKeymap(variant.options), selectedOptions)
    )
  }, [product.variants, selectedOptions])

  const setOptionValue = (optionId: string, value: string) => {
    setSelectedOptions((prev) => ({ ...prev, [optionId]: value }))
  }

  const activeImage = useMemo(
    () => images.find((item) => item.id === activeImageId) ?? images[0] ?? null,
    [activeImageId, images]
  )
  const itemCount = images.length
  const inStock = Boolean(selectedVariant)

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ""

    if (!file) {
      return
    }

    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file")
      return
    }

    if (file.size > MAX_CUSTOM_IMAGE_BYTES) {
      setError("Image must be 8 MB or smaller")
      return
    }

    if (draft?.previewUrl) {
      URL.revokeObjectURL(draft.previewUrl)
    }

    setError(null)
    setSuccessMessage(null)
    setDraft({
      file,
      previewUrl: URL.createObjectURL(file),
      crop: getDefaultCrop(),
    })
  }

  const closeCrop = () => {
    if (draft?.previewUrl) {
      URL.revokeObjectURL(draft.previewUrl)
    }

    setDraft(null)
  }

  const updateCrop = (crop: Partial<CustomCrop>) => {
    setDraft((current) =>
      current
        ? {
            ...current,
            crop: clampCrop({
              ...current.crop,
              ...crop,
            }),
          }
        : current
    )
  }

  // No network call here on purpose: cropping/previewing a design must never
  // write to cloud storage. The file only gets uploaded lazily in addToCart,
  // once the customer actually commits the design to their cart.
  const confirmUpload = () => {
    if (!draft) {
      return
    }

    const nextImage: UploadedCustomImage = {
      id: createImageId(),
      imageUrl: draft.previewUrl,
      file: draft.file,
      filename: draft.file.name,
      crop: draft.crop,
    }

    setImages((current) => [...current, nextImage])
    setActiveImageId(nextImage.id)
    setViewMode("photo")
    setDraft(null)
  }

  const addToCart = () => {
    if (!selectedVariant?.id) {
      return
    }

    if (!images.length) {
      setError("Please upload and crop at least one image first")
      return
    }

    setError(null)
    setSuccessMessage(null)
    startTransition(async () => {
      try {
        const uploaded = await Promise.all(
          images.map(async (image) => {
            if (image.remoteUrl) {
              return image
            }

            const payload = await uploadCustomImage(image.file)
            return {
              ...image,
              remoteUrl: payload.url,
              filename: payload.filename ?? image.filename,
            }
          })
        )
        setImages(uploaded)

        await addItemsToCartAction({
          countryCode,
          items: uploaded.map((image, index) => ({
            source: "custom_hexagon",
            variantId: selectedVariant.id,
            quantity: 1,
            displayTitle: product.title,
            productId: product.id,
            productTitle: product.title,
            customItemIndex: index + 1,
            imageUrl: image.remoteUrl,
            originalFilename: image.filename,
            crop: image.crop,
          })),
        })

        router.refresh()
        setSuccessMessage(
          `Added ${images.length} custom poster${
            images.length > 1 ? "s" : ""
          } to cart`
        )
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not add to cart")
      }
    })
  }

  const removeImage = (imageId: string) => {
    setImages((current) => {
      const target = current.find((item) => item.id === imageId)
      if (target) {
        URL.revokeObjectURL(target.imageUrl)
      }
      return current.filter((item) => item.id !== imageId)
    })
    setActiveImageId((current) => {
      if (current !== imageId) {
        return current
      }

      return images.find((item) => item.id !== imageId)?.id ?? null
    })
    setSuccessMessage(null)
  }

  return (
    <main className="bg-ui-bg-base text-ui-fg-base">
      <section
        className="content-container grid gap-10 py-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)] lg:items-start"
        data-testid="custom-hexagon-container"
      >
        <div className="w-full">
          <div className="grid gap-6 medium:grid-cols-[72px_minmax(0,1fr)]">
            <div className="order-2 flex gap-3 overflow-x-auto medium:order-1 medium:grid medium:max-h-[520px] medium:content-start medium:gap-4 medium:overflow-y-auto medium:overflow-x-visible medium:pr-1">
              {images.map((image, index) => (
                <PreviewThumb
                  key={image.id}
                  image={image}
                  index={index + 1}
                  isActive={viewMode === "photo" && activeImage?.id === image.id}
                  onRemove={() => removeImage(image.id)}
                  onSelect={() => {
                    setActiveImageId(image.id)
                    setViewMode("photo")
                  }}
                />
              ))}
              <button
                type="button"
                onClick={() => setViewMode("spin")}
                disabled={!activeImage}
                className={clx(
                  "grid h-[78px] w-[64px] shrink-0 place-items-center border text-[11px] font-semibold tracking-wide transition-colors",
                  viewMode === "spin"
                    ? "border-ui-fg-interactive bg-ui-bg-base text-ui-fg-interactive"
                    : "border-ui-border-base bg-ui-bg-subtle text-ui-fg-muted hover:text-ui-fg-base",
                  { "cursor-not-allowed opacity-40": !activeImage }
                )}
              >
                360°
              </button>
            </div>

            <div className="order-1 grid place-items-center medium:order-2">
              <div
                className="relative grid w-full place-items-center overflow-hidden"
                style={{ minHeight: 520 }}
              >
                {activeImage && viewMode === "spin" ? (
                  <HexagonProduct3DView
                    imageUrl={activeImage.imageUrl}
                    crop={activeImage.crop}
                  />
                ) : (
                  <div
                    className="relative grid place-items-center overflow-hidden bg-ui-bg-base"
                    style={{
                      clipPath: HEX_CLIP_PATH,
                      height: "min(72vw, 594px)",
                      maxHeight: PREVIEW_HEX_HEIGHT,
                      maxWidth: PREVIEW_HEX_WIDTH,
                      width: "min(62vw, 510px)",
                    }}
                  >
                    {activeImage ? (
                      <CroppedHexImage image={activeImage} />
                    ) : (
                      <label className="grid cursor-pointer gap-3 px-10 text-center">
                        <div className="mx-auto grid h-12 w-12 place-items-center border border-ui-border-base text-2xl text-ui-fg-muted">
                          +
                        </div>
                        <p className="text-sm font-semibold uppercase tracking-normal text-ui-fg-subtle">
                          Upload custom image
                        </p>
                        <input
                          type="file"
                          accept="image/*"
                          className="sr-only"
                          onChange={handleFileChange}
                        />
                      </label>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex w-full flex-col gap-y-8 lg:sticky lg:top-28">
          <div className="flex flex-col gap-y-5">
            <h1 className="max-w-full text-4xl font-black leading-tight text-ui-fg-base">
              Custom Hexagon Poster
            </h1>
            <p className="text-base leading-7 text-ui-fg-subtle whitespace-pre-line">
              {product.description ??
                "Upload your own image and turn it into a custom hexagon poster."}
            </p>
          </div>

        

          {(product.options ?? []).length > 0 &&
            (product.variants?.length ?? 0) > 1 && (
              <div className="grid gap-4">
                {(product.options ?? []).map((option) => (
                  <OptionSelect
                    key={option.id}
                    option={option}
                    current={selectedOptions[option.id]}
                    updateOption={setOptionValue}
                    title={option.title ?? ""}
                    disabled={isPending}
                    data-testid="hexagon-option-select"
                  />
                ))}
              </div>
            )}

          <div className="flex items-end gap-3">
            <ProductPrice product={product} variant={selectedVariant} />
            <p className="pb-1 text-sm text-ui-fg-muted">incl. VAT</p>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <span
              className={clx("h-2 w-2", {
                "bg-green-600": inStock,
                "bg-red-600": !inStock,
              })}
            />
            <p className="text-sm text-ui-fg-base">
              {inStock ? "Made to order" : "Select a variant"}
            </p>
          </div>

          <div className="grid gap-3">
            <div className="flex h-11 items-center justify-between border border-ui-border-base bg-ui-bg-subtle px-4 text-sm">
              <span className="font-medium text-ui-fg-subtle">
                Custom images
              </span>
              <span className="font-bold text-ui-fg-base">{itemCount}</span>
            </div>
            <Button
              onClick={addToCart}
              disabled={
                !inStock || !selectedVariant || isPending || !images.length
              }
              variant="primary"
              className="h-12 w-full text-base font-bold"
              isLoading={isPending}
            >
              Add {itemCount || ""} to cart
            </Button>
          </div>

          <LocalizedClientLink
            href="/custom/wall"
            className="text-sm font-medium text-ui-fg-muted underline underline-offset-4 hover:text-ui-fg-base"
          >
            Build wall preview
          </LocalizedClientLink>

          {error && (
            <p className="border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
              {error}
            </p>
          )}
          {successMessage && (
            <p className="border border-green-200 bg-green-50 px-3 py-2 text-sm font-medium text-green-700">
              {successMessage}
            </p>
          )}
        </div>
      </section>

      {draft && (
        <CustomCropModal
          draft={draft}
          shape="hexagon"
          isUploading={false}
          onCancel={closeCrop}
          onConfirm={confirmUpload}
          onCropChange={updateCrop}
        />
      )}
    </main>
  )
}

const PreviewThumb = ({
  image,
  index,
  isActive,
  onRemove,
  onSelect,
}: {
  image: UploadedCustomImage
  index: number
  isActive: boolean
  onRemove: () => void
  onSelect: () => void
}) => {
  return (
    <div
      className={clx(
        "group relative h-[78px] w-[64px] shrink-0 bg-ui-bg-subtle transition-transform hover:scale-[1.02]",
        {
          "ring-2 ring-ui-fg-interactive ring-offset-2": isActive,
        }
      )}
    >
      <button
        type="button"
        className="absolute inset-0 overflow-hidden"
        onClick={onSelect}
        aria-label={`Preview custom image ${index}`}
        style={{ clipPath: HEX_CLIP_PATH }}
      >
        <CroppedHexImage image={image} frameWidth={64} frameHeight={78} />
      </button>
      <span className="pointer-events-none absolute -left-1 -top-1 grid h-5 w-5 place-items-center bg-black text-[10px] font-bold text-white">
        {index}
      </span>
      <button
        type="button"
        className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center bg-white text-xs font-bold text-ui-fg-subtle opacity-0 shadow-sm ring-1 ring-ui-border-base transition-opacity hover:text-red-600 group-hover:opacity-100"
        onClick={(event) => {
          event.stopPropagation()
          onRemove()
        }}
        aria-label={`Remove custom image ${index}`}
      >
        x
      </button>
    </div>
  )
}

const CroppedHexImage = ({
  image,
  frameWidth = PREVIEW_HEX_WIDTH,
  frameHeight = PREVIEW_HEX_HEIGHT,
}: {
  image: UploadedCustomImage
  frameWidth?: number
  frameHeight?: number
}) => {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={image.imageUrl}
      alt=""
      className="absolute left-1/2 top-1/2 max-w-none select-none"
      draggable={false}
      style={buildCropImageStyle(image.crop, {
        height: frameHeight,
        width: frameWidth,
      })}
    />
  )
}

function createImageId() {
  return `custom-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export default HexagonCustomTemplate
