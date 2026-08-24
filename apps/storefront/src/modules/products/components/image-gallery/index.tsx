"use client"

import { useSearchParams } from "next/navigation"
import { useState, MouseEvent } from "react"
import Image from "next/image"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { clx } from "@modules/common/components/ui"

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

  const handleMove = (event: MouseEvent<HTMLDivElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect()
    const x = ((event.clientX - bounds.left) / bounds.width) * 100
    const y = ((event.clientY - bounds.top) / bounds.height) * 100
    setZoomOrigin(`${x}% ${y}%`)
  }

  return (
    <div
      className="relative aspect-[4/5] w-full overflow-hidden rounded-base border border-ui-border-base bg-ui-bg-subtle shadow-elevation-card-hover"
      onMouseEnter={() => setZoomed(true)}
      onMouseLeave={() => setZoomed(false)}
      onMouseMove={handleMove}
    >
      <Image
        src={image.url}
        alt="Product image"
        fill
        priority
        sizes="(max-width: 1024px) 90vw, 480px"
        className="object-cover transition-transform duration-300 ease-out"
        style={{
          transformOrigin: zoomOrigin,
          transform: zoomed ? "scale(1.6)" : "scale(1)",
        }}
      />
      <div className="pointer-events-none absolute bottom-3 right-3 rounded-base border border-ui-border-base bg-ui-bg-base/80 px-2.5 py-1 text-xs text-ui-fg-interactive">
        ⤢ Zoom
      </div>
    </div>
  )
}

const ImageGallery = ({ images, activeId, productHandle }: ImageGalleryProps) => {
  const searchParams = useSearchParams()

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
      {images.length > 1 && (
        <div className="flex small:flex-col gap-2.5 small:w-[84px] w-full overflow-x-auto small:overflow-visible no-scrollbar">
          {images.map((image) => (
            <LocalizedClientLink
              key={image.id}
              href={hrefForImage(image.index)}
              scroll={false}
              className={clx(
                "relative aspect-square shrink-0 w-16 small:w-full overflow-hidden rounded-base border bg-ui-bg-subtle transition-colors",
                image.id === activeImage.id
                  ? "border-ui-fg-interactive ring-1 ring-ui-fg-interactive"
                  : "border-ui-border-base hover:border-ui-border-interactive"
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
        </div>
      )}

      <div className="flex-1 w-full">
        <ZoomableImage image={activeImage} />
      </div>
    </div>
  )
}

export default ImageGallery
