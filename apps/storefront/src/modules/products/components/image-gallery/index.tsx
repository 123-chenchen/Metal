"use client"

import { useSearchParams } from "next/navigation"
import { useEffect, useState, MouseEvent } from "react"
import Image from "next/image"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { clx } from "@modules/common/components/ui"
import Product3DView from "@modules/products/components/product-3d-view"
import { ProductDesign } from "@lib/util/designs"
import DesignArtwork from "../design-artwork"
import Design3DView from "../design-3d-view"

export type GalleryImage = {
  id: string
  url: string
  index: number // 1-based, matches the product's full image list
}

type ImageGalleryProps = {
  images: GalleryImage[]
  activeId: string | null
  productHandle: string
  design?: ProductDesign
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

// Supplementary gallery selection is local and never changes the purchased design.
const ImageGallery = ({ images, activeId, productHandle, design }: ImageGalleryProps) => {
  const searchParams = useSearchParams()
  const [viewMode, setViewMode] = useState<"photo" | "spin">("photo")
  const [selectedId, setSelectedId] = useState(activeId)
  useEffect(() => { setSelectedId(activeId); setViewMode("photo") }, [activeId, design?.id])

  if (!images.length) {
    return null
  }

  const activeImage = images.find((image) => image.id === (design ? selectedId : activeId)) ?? images[0]
  const isPrimary = activeImage.id === images[0].id

  const hrefForImage = (index: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("img", String(index))
    return `/products/${productHandle}?${params.toString()}`
  }

  return (
    <div className="flex w-full items-start gap-4 small:flex-row flex-col-reverse">
      <div className="flex small:flex-col gap-2.5 small:w-[84px] w-full overflow-x-auto small:overflow-visible no-scrollbar">
        {design ? images.map((image, index) => (
          <button type="button" key={image.id} aria-label={index === 0 ? "Primary artwork" : `Gallery image ${index}`} aria-pressed={activeImage.id === image.id && viewMode === "photo"}
            className={clx("relative aspect-square shrink-0 w-16 small:w-full overflow-hidden rounded-base bg-ui-bg-subtle", activeImage.id === image.id && viewMode === "photo" ? "ring-2 ring-ui-fg-interactive" : "opacity-60")}
            onClick={() => { setSelectedId(image.id); setViewMode("photo") }}>
            {index === 0 ? <DesignArtwork url={image.url} title={design.title} design={design} /> : <Image src={image.url} alt={`Gallery ${index}`} fill sizes="80px" className="object-cover" />}
          </button>
        )) : images.map((image) => (
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

        {isPrimary && <button
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
        </button>}
      </div>

      <div className="flex-1 w-full">
        {viewMode === "photo" ? (
          design && isPrimary ? <div className="flex justify-center items-center max-h-[65vh]"><DesignArtwork url={design.artwork_url} title={design.title} design={design} /></div> : <ZoomableImage image={activeImage} />
        ) : (
          design ? <Design3DView design={design} /> : <Product3DView imageUrl={images[0].url} />
        )}
      </div>
    </div>
  )
}

export default ImageGallery
