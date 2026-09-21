"use client"

import {
  PointerEvent as ReactPointerEvent,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react"
import { buildCropImageStyle, CustomCrop } from "@modules/custom/components/crop"

type HexagonProduct3DViewProps = {
  imageUrl: string | null
  crop: CustomCrop
  alt?: string
}

// Same upright hexagon as the crop editor and saved PNG.
const HEX_ASPECT = 390 / 340
const HEX_CLIP_PATH =
  "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)"
const HEX_POINTS = [[0.5, 0], [1, 0.25], [1, 0.75], [0.5, 1], [0, 0.75], [0, 0.25]]
const SIDE_FACE_SHADES: [string, string][] = [
  ["#55524a", "#1c1b17"],
  ["#46443e", "#17160f"],
  ["#3a382f", "#131311"],
  ["#131311", "#131311"],
  ["#17160f", "#3a382f"],
  ["#17160f", "#46443e"],
]

const AUTO_ROTATE_SPEED = 12
const DRAG_SENSITIVITY = 0.35
const MAX_TILT = 18
const DEFAULT_ROTATION = { x: -8, y: -24 }
const MAX_BOX_HEIGHT = 400
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

const HexagonProduct3DView = ({
  imageUrl,
  crop,
  alt = "Hexagon poster 3D preview",
}: HexagonProduct3DViewProps) => {
  const [rotation, setRotation] = useState(DEFAULT_ROTATION)
  const [dragging, setDragging] = useState(false)
  const [containerWidth, setContainerWidth] = useState(0)
  const [scale, setScale] = useState(1)

  const lastPointer = useRef<{ x: number; y: number } | null>(null)
  const rafId = useRef<number | null>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const zoneRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const el = stageRef.current
    if (!el) return
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
    const handleWheel = (event: WheelEvent) => {
      event.preventDefault()
      setScale((prev) =>
        Math.max(MIN_SCALE, Math.min(MAX_SCALE, prev - event.deltaY * ZOOM_SENSITIVITY))
      )
    }
    el.addEventListener("wheel", handleWheel, { passive: false })
    return () => el.removeEventListener("wheel", handleWheel)
  }, [])

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

  // Fixed real-world hex proportions, fit to the column width (the source
  // photo's own aspect ratio doesn't apply here — it gets cover-cropped into
  // this fixed hex frame, same as the 2D crop tool does).
  let boxWidth = containerWidth || 320
  let boxHeight = boxWidth * HEX_ASPECT
  if (boxHeight > MAX_BOX_HEIGHT) {
    boxHeight = MAX_BOX_HEIGHT
    boxWidth = boxHeight / HEX_ASPECT
  }
  const depth = Math.max(3, Math.min(7, boxWidth * 0.0075))

  return (
    <div ref={stageRef} className="relative w-full bg-black">
      <div
        ref={zoneRef}
        className="flex items-center justify-center overflow-hidden touch-none cursor-grab py-8 active:cursor-grabbing"
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
          The drop-shadow lives on this wrapper, not on the rotor below, for
          the same reason as the rectangular 3D view: a `filter` alongside
          `transform-style: preserve-3d` forces the browser to flatten it,
          corrupting face rendering at grazing angles.
        */}
        <div style={{ filter: "drop-shadow(0 22px 26px rgba(0,0,0,0.65))" }}>
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
              style={{
                ...faceStyle(boxWidth, boxHeight, `translateZ(${depth / 2}px)`),
                clipPath: HEX_CLIP_PATH,
              }}
              className="overflow-hidden"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
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
            </div>

            {/* back */}
            <div
              style={{
                ...faceStyle(
                  boxWidth,
                  boxHeight,
                  `rotateY(180deg) translateZ(${depth / 2}px)`
                ),
                clipPath: HEX_CLIP_PATH,
                background: "linear-gradient(135deg, #2a2a28, #131311)",
              }}
            />

            {/* Derive each rim from the same polygon as the front face. */}
            {HEX_POINTS.map(([x, y], index) => {
              const [nextX, nextY] = HEX_POINTS[(index + 1) % HEX_POINTS.length]
              const dx = (nextX - x) * boxWidth
              const dy = (nextY - y) * boxHeight
              const angle = Math.atan2(dy, dx) * 180 / Math.PI
              const centerX = ((x + nextX) / 2 - 0.5) * boxWidth
              const centerY = ((y + nextY) / 2 - 0.5) * boxHeight
              const [from, to] = SIDE_FACE_SHADES[index]
              return (
                <div
                  key={angle}
                  style={{
                    ...faceStyle(
                      Math.hypot(dx, dy),
                      depth,
                      `translateX(${centerX}px) translateY(${centerY}px) rotateZ(${angle}deg) rotateX(90deg)`
                    ),
                    background: `linear-gradient(90deg, ${from}, ${to})`,
                  }}
                />
              )
            })}
          </div>
        </div>
      </div>

      {/* ground shadow */}
      <div
        className="pointer-events-none mx-auto -mt-6 mb-2 h-8 rounded-[100%] bg-black/70 blur-lg"
        style={{ width: boxWidth * 0.55 * scale }}
      />
    </div>
  )
}

export default HexagonProduct3DView
