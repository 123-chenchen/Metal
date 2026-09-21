import sharp from "sharp"
import { MedusaError } from "@medusajs/framework/utils"

export type CustomArtworkCrop = {
  offsetX?: number
  offsetY?: number
  zoom?: number
  imageRatio?: number | null
}

// Matches the customer's 340 x 390 crop editor. Use actual, oriented image
// dimensions rather than trusting dimensions supplied by the browser.
export function customCropRegion(
  width: number,
  height: number,
  crop: CustomArtworkCrop
) {
  const finite = (value: unknown, fallback: number) =>
    typeof value === "number" && Number.isFinite(value) ? value : fallback
  const zoom = Math.max(1, Math.min(4, finite(crop.zoom, 1)))
  const scale = Math.max(340 / width, 390 / height) * zoom
  const cropWidth = Math.min(width, Math.max(1, Math.round(340 / scale)))
  const cropHeight = Math.min(height, Math.max(1, Math.round(390 / scale)))
  return {
    left: Math.max(
      0,
      Math.min(
        width - cropWidth,
        Math.round((width - cropWidth) / 2 - finite(crop.offsetX, 0) / scale)
      )
    ),
    top: Math.max(
      0,
      Math.min(
        height - cropHeight,
        Math.round((height - cropHeight) / 2 - finite(crop.offsetY, 0) / scale)
      )
    ),
    width: cropWidth,
    height: cropHeight,
  }
}

export async function renderCustomArtwork(
  input: Buffer,
  crop: CustomArtworkCrop,
  shape: "rectangle" | "hexagon"
) {
  const image = sharp(input, { limitInputPixels: 40_000_000 })
  const metadata = await image.metadata()
  if (!["jpeg", "png", "webp"].includes(metadata.format ?? "")) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Only JPG, PNG, and WebP images are supported"
    )
  }
  const oriented = await image
    .autoOrient()
    .toBuffer({ resolveWithObject: true })
  const region = customCropRegion(
    oriented.info.width,
    oriented.info.height,
    crop
  )
  let output = sharp(oriented.data).extract(region).ensureAlpha()
  if (shape === "hexagon") {
    const { width, height } = region
    const mask = Buffer.from(
      `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg"><polygon points="${width / 2},0 ${width},${height / 4} ${width},${height * 0.75} ${width / 2},${height} 0,${height * 0.75} 0,${height / 4}" fill="white"/></svg>`
    )
    output = output.composite([{ input: mask, blend: "dest-in" }])
  }
  return output.png().toBuffer()
}
