import sharp from "sharp"
import { customCropRegion, renderCustomArtwork } from "../custom-artwork"

describe("custom artwork export", () => {
  it("exports the pixels selected by the customer rather than a centered crop", async () => {
    const red = await sharp({ create: { width: 340, height: 390, channels: 3, background: "red" } }).png().toBuffer()
    const input = await sharp({ create: { width: 680, height: 390, channels: 3, background: "blue" } })
      .composite([{ input: red, left: 0, top: 0 }]).png().toBuffer()
    for (const [offsetX, color] of [[170, [255, 0, 0]], [-170, [0, 0, 255]]] as const) {
      const output = await renderCustomArtwork(input, { offsetX, zoom: 1 }, "rectangle")
      const { data } = await sharp(output).raw().toBuffer({ resolveWithObject: true })
      expect(Array.from(data.subarray(0, 3))).toEqual(color)
    }
  })

  it("matches the editor's cover, zoom and drag coordinates", () => {
    expect(customCropRegion(680, 780, {})).toEqual({
      left: 0,
      top: 0,
      width: 680,
      height: 780,
    })
    expect(
      customCropRegion(680, 780, { zoom: 2, offsetX: 50, offsetY: -20 })
    ).toEqual({ left: 120, top: 215, width: 340, height: 390 })
    expect(customCropRegion(1000, 390, { offsetX: 330 })).toEqual({
      left: 0,
      top: 0,
      width: 340,
      height: 390,
    })
    expect(customCropRegion(1000, 390, { offsetX: -9999 })).toEqual({
      left: 660,
      top: 0,
      width: 340,
      height: 390,
    })
  })

  it("clamps invalid numeric values and ignores supplied image dimensions", () => {
    expect(
      customCropRegion(680, 780, {
        zoom: Infinity,
        offsetX: NaN,
        imageRatio: 999,
      })
    ).toEqual(customCropRegion(680, 780, {}))
  })

  it("exports a transparent hexagon and a complete rectangle", async () => {
    const input = await sharp({
      create: { width: 340, height: 390, channels: 3, background: "red" },
    })
      .png()
      .toBuffer()
    for (const shape of ["rectangle", "hexagon"] as const) {
      const output = await renderCustomArtwork(input, {}, shape)
      const { data, info } = await sharp(output)
        .raw()
        .toBuffer({ resolveWithObject: true })
      expect([info.width, info.height, info.channels]).toEqual([340, 390, 4])
      expect(data[3]).toBe(shape === "hexagon" ? 0 : 255)
      expect(data[(195 * 340 + 170) * 4 + 3]).toBe(255)
    }
  })

  it("honors phone photo orientation before cropping", async () => {
    const input = await sharp({
      create: { width: 780, height: 680, channels: 3, background: "blue" },
    })
      .jpeg()
      .withMetadata({ orientation: 6 })
      .toBuffer()
    const output = await renderCustomArtwork(input, {}, "rectangle")
    const metadata = await sharp(output).metadata()
    expect([metadata.width, metadata.height]).toEqual([680, 780])
  })

  it("rejects invalid image bytes", async () => {
    await expect(
      renderCustomArtwork(Buffer.from("invalid"), {}, "hexagon")
    ).rejects.toThrow()
  })
})
