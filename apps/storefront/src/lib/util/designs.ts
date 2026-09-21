import { HttpTypes } from "@medusajs/types"

export type DesignShape = "original" | "vertical" | "horizontal" | "hexagon" | "multi-panel"
export type DesignCrop = { offsetX: number; offsetY: number; zoom: number; imageRatio: number | null }
export type ProductDesign = {
  id: string
  product_id: string
  sequence: number
  title: string
  handle: string
  active: boolean
  archived: boolean
  legacy_index: number | null
  artwork_url: string
  shape: DesignShape
  crop: DesignCrop
  gallery: { images: { id: string; url: string }[] }
  created_at?: string
}

export function productDesigns(product: HttpTypes.StoreProduct): ProductDesign[] {
  return (product as HttpTypes.StoreProduct & { design?: ProductDesign[] }).design ?? []
}

export function designHref(product: HttpTypes.StoreProduct, designId?: string, legacyIndex = 1) {
  return `/products/${product.handle}?${designId ? `design=${encodeURIComponent(designId)}` : `img=${legacyIndex}`}`
}

export function resolveDesign(product: HttpTypes.StoreProduct, designId?: string, legacyIndex?: string) {
  const designs = productDesigns(product)
  const requested = designId
    ? designs.find((design) => design.id === designId)
    : legacyIndex
    ? designs.find((design) => design.legacy_index === Number(legacyIndex))
    : designs.filter((design) => design.active && !design.archived).sort((a, b) => a.sequence - b.sequence)[0]
  return requested?.active && !requested.archived ? requested : null
}
