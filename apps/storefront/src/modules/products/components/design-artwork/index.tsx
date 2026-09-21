"use client"

import { useEffect, useState } from "react"
import { ProductDesign } from "@lib/util/designs"

export const designRatios = { original: 1, vertical: 3 / 4, horizontal: 4 / 3, hexagon: Math.sqrt(3) / 2, "multi-panel": 4 / 3 }
export const hexagonClip = "polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%)"
export const multiPanelMask = "linear-gradient(to right, #000 0% 32%, transparent 32% 34%, #000 34% 66%, transparent 66% 68%, #000 68% 100%)"

// The same artwork positioning is used in cards, primary media and 3D.
export default function DesignArtwork({ url, title, design, fill = false }: {
  url: string; title: string; design?: Pick<ProductDesign, "shape" | "crop">; fill?: boolean
}) {
  const [naturalRatio, setNaturalRatio] = useState(1)
  useEffect(() => {
    const probe = new window.Image()
    probe.onload = () => { if (probe.naturalHeight) setNaturalRatio(probe.naturalWidth / probe.naturalHeight) }
    probe.src = url
    return () => { probe.onload = null }
  }, [url])
  const ratio = design && design.shape !== "original" ? designRatios[design.shape] : naturalRatio
  const crop = design?.crop
  const sourceRatio = crop?.imageRatio || naturalRatio
  const width = sourceRatio >= ratio ? sourceRatio / ratio * 100 : 100
  const height = sourceRatio >= ratio ? 100 : ratio / sourceRatio * 100
  const zoom = crop?.zoom ?? 1
  const maxX = Math.max(0, (width * zoom - 100) / 2 / width * 100)
  const maxY = Math.max(0, (height * zoom - 100) / 2 / height * 100)
  const x = Math.max(-maxX, Math.min(maxX, crop?.offsetX ?? 0))
  const y = Math.max(-maxY, Math.min(maxY, crop?.offsetY ?? 0))
  return (
    <div className={`relative overflow-hidden ${fill ? "h-full w-full" : "max-h-full max-w-full"}`}
      style={{ aspectRatio: ratio, width: fill ? "100%" : ratio >= 1 ? "100%" : `${ratio * 100}%`, clipPath: design?.shape === "hexagon" ? hexagonClip : undefined, maskImage: design?.shape === "multi-panel" ? multiPanelMask : undefined, WebkitMaskImage: design?.shape === "multi-panel" ? multiPanelMask : undefined }}>
      {/* A plain image retains exact pan/zoom across the 2D and 3D surfaces. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt={title} draggable={false} loading="lazy" className="absolute max-w-none select-none"
        style={{ width: `${width}%`, height: `${height}%`, left: "50%", top: "50%", transform: `translate(calc(-50% + ${x}%), calc(-50% + ${y}%)) scale(${zoom})` }} />
    </div>
  )
}
