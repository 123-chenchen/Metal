"use client"

import { useEffect, useRef, useState } from "react"
import { ProductDesign } from "@lib/util/designs"
import DesignArtwork, { designRatios, hexagonClip } from "../design-artwork"

export default function Design3DView({ design }: { design: ProductDesign }) {
  const stage = useRef<HTMLDivElement>(null)
  const interactionArea = useRef<HTMLDivElement>(null)
  const pointer = useRef<{ x: number; y: number } | null>(null)
  const [width, setWidth] = useState(320)
  const [rotation, setRotation] = useState({ x: -8, y: -24 })
  const [zoom, setZoom] = useState(1)
  const [naturalRatio, setNaturalRatio] = useState(1)
  useEffect(() => {
    const probe = new window.Image()
    probe.onload = () => { if (probe.naturalHeight) setNaturalRatio(probe.naturalWidth / probe.naturalHeight) }
    probe.src = design.artwork_url
    return () => { probe.onload = null }
  }, [design.artwork_url])
  useEffect(() => {
    if (!stage.current) return
    const observer = new ResizeObserver(([entry]) => setWidth(Math.min(entry.contentRect.width * 0.8, 440)))
    observer.observe(stage.current)
    return () => observer.disconnect()
  }, [])
  useEffect(() => {
    const area = interactionArea.current
    if (!area) return
    const handleWheel = (event: WheelEvent) => {
      // Preserve browser/trackpad accessibility zoom gestures.
      if (event.ctrlKey || event.metaKey) return
      event.preventDefault()
      const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? area.clientHeight : 1)
      setZoom((value) => Math.max(0.6, Math.min(1.6, value * Math.exp(-Math.max(-200, Math.min(200, delta)) * 0.002))))
    }
    area.addEventListener("wheel", handleWheel, { passive: false })
    return () => area.removeEventListener("wheel", handleWheel)
  }, [])
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    let frame = 0
    let previous = performance.now()
    const tick = (now: number) => {
      const elapsed = Math.min(now - previous, 100)
      previous = now
      if (!pointer.current) setRotation((value) => ({ ...value, y: (value.y + elapsed * 0.012) % 360 }))
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [])
  const height = width / (design.shape === "original" ? naturalRatio : designRatios[design.shape])
  const panels = design.shape === "multi-panel" ? 3 : 1
  const panelWidth = panels === 3 ? width * 0.32 : width
  const polygon = design.shape === "hexagon"
    ? [[width / 2, 0], [width, height * 0.25], [width, height * 0.75], [width / 2, height], [0, height * 0.75], [0, height * 0.25]]
    : [[0, 0], [panelWidth, 0], [panelWidth, height], [0, height]]
  const clipPath = design.shape === "hexagon" ? hexagonClip : undefined
  return <div ref={stage} className="w-full">
    <div ref={interactionArea} tabIndex={0} role="group" aria-label="3D poster. Drag to rotate, scroll to zoom. Arrow keys rotate, plus and minus zoom, 0 resets."
      className="flex justify-center items-center py-12 overflow-hidden touch-none cursor-grab active:cursor-grabbing focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
      style={{ perspective: 1200, minHeight: height + 100 }}
      onKeyDown={(event) => {
        if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "+", "=", "-", "0"].includes(event.key)) return
        event.preventDefault()
        if (event.key === "0") { setRotation({ x: -8, y: -24 }); setZoom(1) }
        else if (["+", "=", "-"].includes(event.key)) setZoom((value) => Math.max(0.6, Math.min(1.6, value + (event.key === "-" ? -0.1 : 0.1))))
        else setRotation((value) => ({ x: Math.max(-35, Math.min(35, value.x + (event.key === "ArrowUp" ? -5 : event.key === "ArrowDown" ? 5 : 0))), y: value.y + (event.key === "ArrowLeft" ? -5 : event.key === "ArrowRight" ? 5 : 0) }))
      }}
      onPointerDown={(event) => { if (!event.isPrimary || event.button !== 0) return; event.currentTarget.focus({ preventScroll: true }); event.currentTarget.setPointerCapture(event.pointerId); pointer.current = { x: event.clientX, y: event.clientY } }}
      onPointerMove={(event) => {
        if (!event.isPrimary || !pointer.current) return
        const dx = event.clientX - pointer.current.x
        const dy = event.clientY - pointer.current.y
        pointer.current = { x: event.clientX, y: event.clientY }
        setRotation((value) => ({ x: Math.max(-35, Math.min(35, value.x - dy * 0.35)), y: value.y + dx * 0.35 }))
      }}
      onPointerUp={() => { pointer.current = null }}
      onPointerCancel={() => { pointer.current = null }}
      onLostPointerCapture={() => { pointer.current = null }}>
      <div style={{ position: "relative", width, height, transformStyle: "preserve-3d", transform: `scale(${zoom}) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)` }}>
        {Array.from({ length: panels }, (_, panel) => {
          const left = panel * width * 0.34
          return <div key={panel} style={{ position: "absolute", left, width: panelWidth, height, transformStyle: "preserve-3d" }}>
            <div style={{ position: "absolute", inset: 0, overflow: "hidden", clipPath, backfaceVisibility: "hidden", transform: "translateZ(2px)" }}>
              <div style={{ position: "absolute", left: -left, top: 0, width, height }}>
                <DesignArtwork url={design.artwork_url} title={design.title} design={panels === 3 ? { ...design, shape: "horizontal" } : design} fill />
              </div>
            </div>
            <div style={{ position: "absolute", inset: 0, clipPath, backfaceVisibility: "hidden", background: "linear-gradient(135deg,#41413e,#171717)", transform: "rotateY(180deg) translateZ(2px)" }} />
            {polygon.map(([x1, y1], index) => {
              const [x2, y2] = polygon[(index + 1) % polygon.length]
              const length = Math.hypot(x2 - x1, y2 - y1)
              const angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI
              return <div key={index} style={{ position: "absolute", left: (x1 + x2) / 2 - length / 2, top: (y1 + y2) / 2 - 2, width: length, height: 4, background: "linear-gradient(#777,#282828)", transform: `rotateZ(${angle}deg) rotateX(90deg)` }} />
            })}
          </div>
        })}
      </div>
    </div>
  </div>
}
