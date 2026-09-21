import {
  orderArtwork,
  orderCropStyle,
  safeArtworkUrl,
} from "../order-custom-artwork"
import { customCropRegion } from "../../../lib/custom-artwork"

describe("order artwork preview", () => {
  it("can reconstruct an older order without a cropped URL", () => {
    const crop = { offsetX: 50, offsetY: -20, zoom: 2 }
    const artwork = orderArtwork({
      custom_image_url: "https://example.com/original.jpg",
      custom_crop: crop,
      custom_source: "custom_wall",
    })
    expect(artwork.original).toBeTruthy()
    expect(artwork.cropped).toBeNull()
    expect(artwork.crop).toEqual(crop)
    expect(artwork.hexagon).toBe(true)
  })

  it("retains separate files on new orders and does not invent missing crop data", () => {
    expect(
      orderArtwork({
        custom_image_url: "/original.jpg",
        custom_cropped_image_url: "/crop.png",
      })
    ).toMatchObject({
      original: "/original.jpg",
      cropped: "/crop.png",
      crop: null,
    })
    expect(orderArtwork({ custom_image_url: "/original.jpg" }).crop).toBeNull()
    expect(orderArtwork({ custom_source: "custom_standard" }).hexagon).toBe(
      false
    )
    expect(safeArtworkUrl("javascript:alert(1)")).toBeNull()
  })

  it("shows the same selected pixels as PNG export for landscape and portrait photos", () => {
    for (const [width, height] of [
      [1200, 400],
      [400, 1200],
      [680, 780],
    ]) {
      for (const zoom of [1, 2, 4]) {
        for (const offset of [-100, 0, 100]) {
          const crop = { zoom, offsetX: offset, offsetY: -offset }
          const style = orderCropStyle(crop, width / height)
          const region = customCropRegion(width, height, crop)
          const drawnWidth = (parseFloat(style.width) / 100) * 340 * zoom
          const drawnHeight = (parseFloat(style.height) / 100) * 390 * zoom
          const left =
            ((drawnWidth / 2 - (parseFloat(style.left) / 100) * 340) /
              drawnWidth) *
            width
          const top =
            ((drawnHeight / 2 - (parseFloat(style.top) / 100) * 390) /
              drawnHeight) *
            height
          expect(Math.abs(region.left - left)).toBeLessThanOrEqual(1)
          expect(Math.abs(region.top - top)).toBeLessThanOrEqual(1)
          expect(
            Math.abs(region.width - (340 / drawnWidth) * width)
          ).toBeLessThanOrEqual(1)
          expect(
            Math.abs(region.height - (390 / drawnHeight) * height)
          ).toBeLessThanOrEqual(1)
        }
      }
    }
  })
})
