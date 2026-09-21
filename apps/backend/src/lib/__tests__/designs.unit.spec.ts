import { designCommandSchema, designTitle, reorderGallery, validateDesignFile } from "../designs"

describe("design input rules", () => {
  it("does not wrap numbering after 999", () => {
    expect(designTitle("Dragon Ball", 4)).toBe("Dragon Ball 004")
    expect(designTitle("Dragon Ball", 1000)).toBe("Dragon Ball 1000")
  })
  it("rejects duplicate and missing gallery IDs", () => {
    const images = [{ id: "a", url: "a.png", file_id: null }, { id: "b", url: "b.png", file_id: null }]
    expect(reorderGallery(images, ["b", "a"]).map((image) => image.id)).toEqual(["b", "a"])
    expect(() => reorderGallery(images, ["a", "a"])).toThrow()
    expect(() => reorderGallery(images, ["a"])).toThrow()
  })
  it("rejects executable content disguised as an image", () => {
    expect(() => validateDesignFile({ filename: "image.png", mime_type: "image/png", content: Buffer.from("<svg onload='alert(1)' />").toString("base64") })).toThrow()
  })
  it("rejects crop values outside supported bounds", () => {
    expect(designCommandSchema.safeParse({ action: "update", design_id: "design_a", version: 1, title: "Art", active: true, shape: "hexagon", crop: { zoom: 0, offsetX: 0, offsetY: 0, imageRatio: 1 } }).success).toBe(false)
  })
})
