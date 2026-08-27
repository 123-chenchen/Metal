"use client"

import Image from "next/image"
import {
  PointerEvent as ReactPointerEvent,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react"
import { buildCropImageStyle, CustomCrop } from "@modules/custom/components/crop"

type Product3DViewProps = {
  imageUrl: string | null
  alt?: string
  // When set, the front face is positioned exactly like the 2D crop preview
  // (same pan/zoom) instead of being auto-cropped with CSS object-cover, and
  // frameRatio (the crop frame's own width/height ratio) replaces the source
  // photo's ratio for sizing the box.
  crop?: CustomCrop
  frameRatio?: number
}

const AUTO_ROTATE_SPEED = 12 // degrees per second
const DRAG_SENSITIVITY = 0.35
const MAX_TILT = 18
const DEFAULT_ROTATION = { x: -8, y: -24 }
const MAX_BOX_HEIGHT = 460
const DEFAULT_RATIO = 4 / 5
const MIN_SCALE = 0.6
const MAX_SCALE = 2.5
const ZOOM_SENSITIVITY = 0.0015

const faceStyle = (width: number, height: number, transform: string) => ({
  position: "absolute" as const,
  top: "50%",
  left: "50%",
  width,
  height,
  marginLeft: -width / 2,
  marginTop: -height / 2,
  transform,
  backfaceVisibility: "hidden" as const,
})

const Product3DView = ({
  imageUrl,
  alt = "Product 3D preview",
  crop,
  frameRatio,
}: Product3DViewProps) => {
  const [rotation, setRotation] = useState(DEFAULT_ROTATION)
  const [dragging, setDragging] = useState(false)
  const [ratio, setRatio] = useState(DEFAULT_RATIO)
  const [containerWidth, setContainerWidth] = useState(0)
  const [scale, setScale] = useState(1)

  const lastPointer = useRef<{ x: number; y: number } | null>(null)
  const rafId = useRef<number | null>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const zoneRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const el = stageRef.current
    if (!el) return
    // Seed the width synchronously so the box is sized correctly on the
    // very first paint instead of flashing at the fallback size.
    setContainerWidth(el.getBoundingClientRect().width)

    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width
      if (width) setContainerWidth(width)
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const el = zoneRef.current
    if (!el) return
    // A native listener (not React's onWheel) so { passive: false } is
    // honored and preventDefault() reliably stops the page from scrolling
    // while the user zooms the 3D view.
    const handleWheel = (event: WheelEvent) => {
      event.preventDefault()
      setScale((prev) =>
        Math.max(MIN_SCALE, Math.min(MAX_SCALE, prev - event.deltaY * ZOOM_SENSITIVITY))
      )
    }
    el.addEventListener("wheel", handleWheel, { passive: false })
    return () => el.removeEventListener("wheel", handleWheel)
  }, [])

  // Load the image through a plain probe rather than relying on the
  // rendered <Image>'s onLoad: with `priority`, the browser can finish
  // fetching (from cache or otherwise) before React attaches the listener,
  // so the event fires too early to be observed.
  useEffect(() => {
    // With a crop, the box must match the crop frame's own shape (e.g. the
    // poster's fixed aspect ratio), not the source photo's raw dimensions.
    if (!imageUrl || crop) return
    const probe = new window.Image()
    probe.onload = () => {
      if (probe.naturalWidth && probe.naturalHeight) {
        setRatio(probe.naturalWidth / probe.naturalHeight)
      }
    }
    probe.src = imageUrl
  }, [imageUrl, crop])

  useEffect(() => {
    if (dragging) {
      if (rafId.current) cancelAnimationFrame(rafId.current)
      return
    }

    let last = performance.now()
    const tick = (now: number) => {
      const dt = (now - last) / 1000
      last = now
      setRotation((prev) => ({ ...prev, y: prev.y + AUTO_ROTATE_SPEED * dt }))
      rafId.current = requestAnimationFrame(tick)
    }
    rafId.current = requestAnimationFrame(tick)

    return () => {
      if (rafId.current) cancelAnimationFrame(rafId.current)
    }
  }, [dragging])

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId)
    lastPointer.current = { x: event.clientX, y: event.clientY }
    setDragging(true)
  }

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragging || !lastPointer.current) return
    const dx = event.clientX - lastPointer.current.x
    const dy = event.clientY - lastPointer.current.y
    lastPointer.current = { x: event.clientX, y: event.clientY }

    setRotation((prev) => ({
      x: Math.max(-MAX_TILT, Math.min(MAX_TILT, prev.x - dy * DRAG_SENSITIVITY)),
      y: prev.y + dx * DRAG_SENSITIVITY,
    }))
  }

  const endDrag = () => {
    setDragging(false)
    lastPointer.current = null
  }

  if (!imageUrl) {
    return null
  }

  // Fit the box to the column width, then cap the height so a very tall
  // (portrait) poster doesn't blow past a sensible viewport height.
  const effectiveRatio = crop ? frameRatio ?? DEFAULT_RATIO : ratio
  let boxWidth = containerWidth || 320
  let boxHeight = boxWidth / effectiveRatio
  if (boxHeight > MAX_BOX_HEIGHT) {
    boxHeight = MAX_BOX_HEIGHT
    boxWidth = boxHeight * effectiveRatio
  }
  const depth = Math.max(3, Math.min(7, boxWidth * 0.0075))

  return (
    <div ref={stageRef} className="relative w-full">
      <div
        ref={zoneRef}
        className="flex items-center justify-center overflow-hidden touch-none cursor-grab py-6 active:cursor-grabbing"
        style={{ perspective: 1400 }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={(e) => {
          endDrag()
          try {
            e.currentTarget.releasePointerCapture(e.pointerId)
          } catch {}
        }}
        onPointerCancel={endDrag}
      >
        {/*
          The drop-shadow lives on this wrapper, not on the rotor below.
          A `filter` on the same element as `transform-style: preserve-3d`
          forces the browser to flatten it, corrupting the face rendering
          (faces render as blank/white slivers at grazing angles).
        */}
        <div style={{ filter: "drop-shadow(0 22px 26px rgba(0,0,0,0.5))" }}>
          <div
            style={{
              width: boxWidth,
              height: boxHeight,
              transformStyle: "preserve-3d",
              transform: `scale(${scale}) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
              transition: dragging ? "none" : "transform 120ms linear",
            }}
          >
            {/* front */}
            <div
              style={faceStyle(boxWidth, boxHeight, `translateZ(${depth / 2}px)`)}
              className="overflow-hidden"
            >
              {crop ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imageUrl}
                  alt={alt}
                  draggable={false}
                  className="absolute left-1/2 top-1/2 max-w-none select-none"
                  style={buildCropImageStyle(crop, {
                    height: boxHeight,
                    width: boxWidth,
                  })}
                />
              ) : (
                <Image
                  src={imageUrl}
                  alt={alt}
                  fill
                  priority
                  sizes="(max-width: 1024px) 90vw, 640px"
                  className="object-cover"
                />
              )}
            </div>

            {/* back */}
            <div
              style={{
                ...faceStyle(boxWidth, boxHeight, `rotateY(180deg) translateZ(${depth / 2}px)`),
                background: "linear-gradient(135deg, #2a2a28, #131311)",
              }}
            />

            {/* right */}
            <div
              style={{
                ...faceStyle(depth, boxHeight, `rotateY(90deg) translateZ(${boxWidth / 2}px)`),
                background: "linear-gradient(90deg, #46443e, #17160f)",
              }}
            />

            {/* left */}
            <div
              style={{
                ...faceStyle(depth, boxHeight, `rotateY(-90deg) translateZ(${boxWidth / 2}px)`),
                background: "linear-gradient(90deg, #17160f, #46443e)",
              }}
            />

            {/* top */}
            <div
              style={{
                ...faceStyle(boxWidth, depth, `rotateX(90deg) translateZ(${boxHeight / 2}px)`),
                background: "linear-gradient(180deg, #55524a, #1c1b17)",
              }}
            />

            {/* bottom */}
            <div
              style={{
                ...faceStyle(boxWidth, depth, `rotateX(-90deg) translateZ(${boxHeight / 2}px)`),
                background: "linear-gradient(180deg, #131311, #131311)",
              }}
            />
          </div>
        </div>
      </div>

      {/* ground shadow */}
      <div
        className="pointer-events-none mx-auto -mt-6 mb-2 h-8 rounded-[100%] bg-black/60 blur-lg"
        style={{ width: boxWidth * 0.75 * scale }}
      />
    </div>
  )
}

export default Product3DView
