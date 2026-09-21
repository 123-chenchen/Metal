import { resolveCartDesign } from "../design-cart"
import { Modules } from "@medusajs/framework/utils"

describe("wall design validation", () => {
  const design = { id: "design_a", product_id: "product_1", title: "Design A", artwork_url: "/a.png", sequence: 1, legacy_index: 1, active: true, archived: false, shape: "hexagon", crop: { zoom: 2 }, version: 3 }
  const makeScope = (designs: Record<string, unknown>[]) => ({ resolve: (key: string) => key === Modules.PRODUCT
    ? { retrieveProductVariant: async () => ({ product_id: "product_1" }) }
    : { listDesigns: async () => designs } })

  it("uses authoritative artwork and crop instead of client values", async () => {
    const metadata = await resolveCartDesign(makeScope([design]) as never, "variant_1", { selected_design_id: "design_a", selected_image_url: "/wrong.png" })
    expect(metadata).toMatchObject({ selected_design_id: "design_a", selected_image_url: "/a.png", selected_design_crop: { zoom: 2 } })
  })

  it.each([{ ...design, active: false }, { ...design, archived: true }, null])("rejects unavailable or foreign designs", async (candidate) => {
    await expect(resolveCartDesign(makeScope(candidate ? [candidate] : []) as never, "variant_1", { selected_design_id: "design_a" })).rejects.toThrow("unavailable or does not belong")
  })
})
