import { z } from "@medusajs/framework/zod"
import { MedusaError } from "@medusajs/framework/utils"

export const designShapeSchema = z.enum(["original", "vertical", "horizontal", "hexagon", "multi-panel"])
export const designCropSchema = z.object({
  offsetX: z.number().min(-100).max(100),
  offsetY: z.number().min(-100).max(100),
  zoom: z.number().min(1).max(4),
  imageRatio: z.number().positive().max(100).nullable(),
}).strict()

export const designFileSchema = z.object({
  filename: z.string().min(1).max(255),
  mime_type: z.enum(["image/jpeg", "image/png", "image/webp"]),
  content: z.string().min(1).max(12 * 1024 * 1024),
}).strict()

export const designCommandSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("import") }),
  z.object({
    action: z.literal("upload"),
    request_id: z.string().uuid(),
    design_id: z.string().optional(),
    title: z.string().trim().min(1).max(160).optional(),
    shape: designShapeSchema.default("vertical"),
    file: designFileSchema,
  }).strict(),
  z.object({
    action: z.literal("update"),
    design_id: z.string(),
    version: z.number().int().positive(),
    title: z.string().trim().min(1).max(160),
    active: z.boolean(),
    shape: designShapeSchema,
    crop: designCropSchema,
  }).strict(),
  z.object({
    action: z.enum(["archive", "promote", "remove-gallery", "reorder-gallery"]),
    design_id: z.string(),
    version: z.number().int().positive(),
    image_id: z.string().optional(),
    image_ids: z.array(z.string()).max(30).optional(),
  }).strict(),
])

export type DesignCommand = z.infer<typeof designCommandSchema>
export type DesignCrop = z.infer<typeof designCropSchema>
export type DesignGalleryImage = { id: string; url: string; file_id: string | null; request_key?: string }
export const defaultDesignCrop: DesignCrop = { offsetX: 0, offsetY: 0, zoom: 1, imageRatio: null }

export function designTitle(title: string, sequence: number) {
  return `${title} ${String(sequence).padStart(3, "0")}`
}

export function designHandle(title: string, id: string) {
  const slug = title.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
  return `${slug || "design"}-${id}`
}

export function readGallery(value: unknown): DesignGalleryImage[] {
  const images = (value as { images?: unknown } | null)?.images
  return Array.isArray(images) ? images as DesignGalleryImage[] : []
}

export function validateDesignFile(file: z.infer<typeof designFileSchema>) {
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(file.content) || file.content.length % 4 !== 0) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "Invalid image encoding")
  }
  const bytes = Buffer.from(file.content, "base64")
  if (!bytes.length || bytes.length > 8 * 1024 * 1024) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "Each image must be at most 8 MB")
  }
  const png = bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  const jpeg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
  const webp = bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP"
  if (!(file.mime_type === "image/png" && png || file.mime_type === "image/jpeg" && jpeg || file.mime_type === "image/webp" && webp)) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "File content must match a JPG, PNG or WebP image")
  }
  return file.mime_type === "image/jpeg" ? "jpg" : file.mime_type === "image/png" ? "png" : "webp"
}

export function reorderGallery(gallery: DesignGalleryImage[], ids: string[]) {
  if (ids.length !== gallery.length || new Set(ids).size !== ids.length || ids.some((id) => !gallery.some((image) => image.id === id))) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "Gallery order must include every image exactly once")
  }
  return ids.map((id) => gallery.find((image) => image.id === id)!)
}
