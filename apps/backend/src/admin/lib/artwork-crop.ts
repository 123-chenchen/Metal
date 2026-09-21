export type ArtworkCrop = { offsetX: number; offsetY: number; zoom: number; imageRatio: number | null }

export function cropGeometry(source: number, target: number, crop: ArtworkCrop) {
  const width = Math.max(1, source / target)
  const height = Math.max(1, target / source)
  const zoom = Math.max(1, Math.min(4, crop.zoom))
  const maxX = Math.min(100, Math.max(0, (width * zoom - 1) / (2 * width) * 100))
  const maxY = Math.min(100, Math.max(0, (height * zoom - 1) / (2 * height) * 100))
  return { width, height, crop: { ...crop, zoom, offsetX: Math.max(-maxX, Math.min(maxX, crop.offsetX)), offsetY: Math.max(-maxY, Math.min(maxY, crop.offsetY)) } }
}

export function dragCrop(crop: ArtworkCrop, source: number, target: number, frameWidth: number, frameHeight: number, dx: number, dy: number) {
  const current = cropGeometry(source, target, crop)
  return cropGeometry(source, target, { ...current.crop, offsetX: current.crop.offsetX + dx / (frameWidth * current.width) * 100, offsetY: current.crop.offsetY + dy / (frameHeight * current.height) * 100 }).crop
}

// Keep the artwork point beneath the cursor fixed as zoom changes.
export function zoomCrop(crop: ArtworkCrop, source: number, target: number, zoom: number, cursorX = 0, cursorY = 0) {
  const current = cropGeometry(source, target, crop)
  const nextZoom = Math.max(1, Math.min(4, zoom))
  const scale = nextZoom / current.crop.zoom
  return cropGeometry(source, target, { ...current.crop, zoom: nextZoom, offsetX: current.crop.offsetX * scale + cursorX / current.width * 100 * (1 - scale), offsetY: current.crop.offsetY * scale + cursorY / current.height * 100 * (1 - scale) }).crop
}
