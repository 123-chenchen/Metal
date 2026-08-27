"use client"

import { useSearchParams } from "next/navigation"
import { useEffect, useState, MouseEvent } from "react"
import Image from "next/image"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { clx } from "@modules/common/components/ui"
import Product3DView from "@modules/products/components/product-3d-view"

export type GalleryImage = {
  id: string
  url: string
  index: number // 1-based, matches the product's full image list
}

type ImageGalleryProps = {
  images: GalleryImage[]
  activeId: string | null
  productHandle: string
}

const ZoomableImage = ({ image }: { image: GalleryImage }) => {
  const [zoomOrigin, setZoomOrigin] = useState("50% 50%")
  const [zoomed, setZoomed] = useState(false)
  const [ratio, setRatio] = useState(4 / 5)

  // Load through a plain probe rather than relying on <Image>'s onLoad:
  // with `priority`, the browser can finish fetching before React attaches
  // the listener, so the event fires too early to be observed.
  useEffect(() => {
    const probe = new window.Image()
    probe.onload = () => {
      if (probe.naturalWidth && probe.naturalHeight) {
        setRatio(probe.naturalWidth / probe.naturalHeight)
      }
    }
    probe.src = image.url
  }, [image.url])

  const handleMove = (event: MouseEvent<HTMLDivElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect()
    const x = ((event.clientX - bounds.left) / bounds.width) * 100
    const y = ((event.clientY - bounds.top) / bounds.height) * 100
    setZoomOrigin(`${x}% ${y}%`)
  }

  return (
    <div
      className="relative mx-auto w-full max-h-[58vh] overflow-hidden"
      style={{ aspectRatio: ratio }}
      onMouseEnter={() => setZoomed(true)}
      onMouseLeave={() => setZoomed(false)}
      onMouseMove={handleMove}
    >
      <Image
        src={image.url}
        alt="Product image"
        fill
        priority
        sizes="(max-width: 1024px) 90vw, 640px"
        className="object-contain transition-transform duration-300 ease-out"
        style={{
          transformOrigin: zoomOrigin,
          transform: zoomed ? "scale(1.6)" : "scale(1)",
        }}
      />
      <div className="pointer-events-none absolute bottom-3 right-3 rounded-base bg-ui-bg-base/80 px-2.5 py-1 text-xs text-ui-fg-interactive shadow-elevation-card-rest">
        ⤢ Zoom
      </div>
    </div>
  )
}

// Extra blank frames rendered after the real thumbnails so there's a visual
// slot ready to go as soon as more photos/designs are uploaded for this
// product, without changing the rail layout.
const EMPTY_THUMBNAIL_SLOTS = 2

const ImageGallery = ({ images, activeId, productHandle }: ImageGalleryProps) => {
  const searchParams = useSearchParams()
  const [viewMode, setViewMode] = useState<"photo" | "spin">("photo")

  if (!images.length) {
    return null
  }

  const activeImage = images.find((image) => image.id === activeId) ?? images[0]

  const hrefForImage = (index: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("img", String(index))
    return `/products/${productHandle}?${params.toString()}`
  }

  return (
    <div className="flex w-full items-start gap-4 small:flex-row flex-col-reverse">
      <div className="flex small:flex-col gap-2.5 small:w-[84px] w-full overflow-x-auto small:overflow-visible no-scrollbar">
        {images.map((image) => (
          <LocalizedClientLink
            key={image.id}
            href={hrefForImage(image.index)}
            scroll={false}
            onClick={() => setViewMode("photo")}
            className={clx(
              "relative aspect-square shrink-0 w-16 small:w-full overflow-hidden rounded-base bg-ui-bg-subtle transition-all",
              viewMode === "photo" && image.id === activeImage.id
                ? "ring-2 ring-ui-fg-interactive opacity-100"
                : "opacity-60 hover:opacity-100"
            )}
          >
            <Image
              src={image.url}
              alt=""
              fill
              sizes="80px"
              className="object-cover"
            />
          </LocalizedClientLink>
        ))}

        <button
          type="button"
          onClick={() => setViewMode("spin")}
          className={clx(
            "relative flex aspect-square shrink-0 w-16 small:w-full items-center justify-center overflow-hidden rounded-base border border-ui-border-base bg-ui-bg-subtle text-[11px] font-semibold tracking-wide text-ui-fg-subtle transition-all",
            viewMode === "spin"
              ? "ring-2 ring-ui-fg-interactive opacity-100 text-ui-fg-interactive"
              : "opacity-60 hover:opacity-100"
          )}
        >
          360°
        </button>

        {Array.from({ length: EMPTY_THUMBNAIL_SLOTS }).map((_, index) => (
          <div
            key={`empty-thumbnail-slot-${index}`}
            className="aspect-square shrink-0 w-16 small:w-full rounded-base border border-dashed border-ui-border-base"
          />
        ))}
      </div>

      <div className="flex-1 w-full">
        {viewMode === "photo" ? (
          <ZoomableImage image={activeImage} />
        ) : (
          <Product3DView imageUrl={activeImage.url} />
        )}
      </div>
    </div>
  )
}

export default ImageGallery
