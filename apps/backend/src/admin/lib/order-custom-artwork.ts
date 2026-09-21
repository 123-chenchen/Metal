export function safeArtworkUrl(value: unknown): string | null {
  if (typeof value !== "string" || !value) return null
  if (value.startsWith("/") && !value.startsWith("//")) return value
  try {
    return ["https:", "http:"].includes(new URL(value).protocol) ? value : null
  } catch {
    return null
  }
}

export function orderArtwork(
  metadata: Record<string, unknown> | null | undefined
) {
  const crop = metadata?.custom_crop
  return {
    original: safeArtworkUrl(metadata?.custom_image_url),
    cropped: safeArtworkUrl(metadata?.custom_cropped_image_url),
    crop:
      crop && typeof crop === "object" && !Array.isArray(crop)
        ? (crop as Record<string, unknown>)
        : null,
    hexagon:
      metadata?.custom_type === "hexagon_poster" ||
      metadata?.custom_source === "custom_hexagon" ||
      metadata?.custom_source === "custom_wall",
  }
}

// Reproduce the customer's frame even when the order has no separate PNG.
export function orderCropStyle(
  crop: Record<string, unknown>,
  naturalRatio: number
) {
  const finite = (value: unknown, fallback: number) =>
    typeof value === "number" && Number.isFinite(value) ? value : fallback
  const ratio =
    Number.isFinite(naturalRatio) && naturalRatio > 0 ? naturalRatio : 1
  const width = Math.max(340, 390 * ratio)
  const height = Math.max(390, 340 / ratio)
  const zoom = Math.max(1, Math.min(4, finite(crop.zoom, 1)))
  const maxX = (width * zoom - 340) / 2
  const maxY = (height * zoom - 390) / 2
  const x = Math.max(-maxX, Math.min(maxX, finite(crop.offsetX, 0)))
  const y = Math.max(-maxY, Math.min(maxY, finite(crop.offsetY, 0)))
  return {
    width: `${(width / 340) * 100}%`,
    height: `${(height / 390) * 100}%`,
    left: `${50 + (x / 340) * 100}%`,
    top: `${50 + (y / 390) * 100}%`,
    transform: `translate(-50%, -50%) scale(${zoom})`,
  }
}
