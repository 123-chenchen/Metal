import { z } from "@medusajs/framework/zod"

const mediaUrl = z
  .string()
  .trim()
  .url()
  .refine((value) => /^https?:\/\//i.test(value), "Use an HTTP or HTTPS URL")
const linkUrl = z
  .string()
  .trim()
  .refine((value) => {
    if (!value) return true
    if (/[\\\u0000-\u0020]/.test(value)) return false
    if (value.startsWith("/") && !value.startsWith("//")) return true
    try {
      return ["http:", "https:"].includes(new URL(value).protocol)
    } catch {
      return false
    }
  }, "Use a storefront path or an HTTP/HTTPS URL")

export const homeHeroSchema = z.object({
  media_aspect_ratio: z.enum([
    "auto",
    "16 / 9",
    "4 / 3",
    "1 / 1",
    "21 / 9",
    "custom",
  ]),
  width: z.number().int().min(1).max(10000),
  height: z.number().int().min(1).max(10000),
  slide_interval_seconds: z.number().min(2).max(300),
  media_slides: z
    .array(
      z.object({
        id: z.string().min(1),
        media_type: z.enum(["image", "video"]),
        media_url: mediaUrl,
        media_aspect_ratio: z
          .enum(["16 / 9", "4 / 3", "1 / 1", "21 / 9"])
          .optional(),
        media_file_id: z.string().nullable(),
        media_object_position: z.enum([
          "center center",
          "center top",
          "center bottom",
          "left center",
          "right center",
        ]),
        link_url: linkUrl,
      })
    )
    .max(100),
})

export type HomeHeroConfig = z.infer<typeof homeHeroSchema>

type LegacySlide = {
  id: string
  image_url: string
  image_file_id?: string | null
  link_type: string
  link_value?: string | null
}

export function getHomeHeroConfig(
  config: unknown,
  slides: LegacySlide[]
): HomeHeroConfig {
  const parsed = homeHeroSchema.safeParse(config)
  if (parsed.success) return parsed.data
  return {
    media_aspect_ratio: "auto",
    width: 1920,
    height: 1080,
    slide_interval_seconds: 5,
    media_slides: slides.map((slide) => ({
      id: slide.id,
      media_type: "image",
      media_url: slide.image_url,
      media_file_id: slide.image_file_id ?? null,
      media_object_position: "center center",
      link_url:
        slide.link_value && slide.link_type !== "none"
          ? `/${slide.link_type === "collection" ? "collections" : "categories"}/${slide.link_value}`
          : "",
    })),
  }
}
