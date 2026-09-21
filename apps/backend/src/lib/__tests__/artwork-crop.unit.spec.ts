import { cropGeometry, dragCrop, zoomCrop } from "../../admin/lib/artwork-crop"

const crop = { offsetX: 0, offsetY: 0, zoom: 2, imageRatio: 1.5 }

describe("artwork mouse crop", () => {
  it("moves the displayed image exactly by the mouse delta at different zoom levels", () => {
    for (const zoom of [1.5, 2, 4]) {
      const next = dragCrop({ ...crop, zoom }, 1.5, 0.75, 300, 400, 30, -20)
      expect(next.offsetX / 100 * 600).toBeCloseTo(30)
      expect(next.offsetY / 100 * 400).toBeCloseTo(-20)
    }
  })

  it("keeps the source point beneath the cursor fixed when zooming", () => {
    const before = { ...crop, offsetX: 5, offsetY: -5 }
    const next = zoomCrop(before, 1.5, 0.75, 3, 0.2, -0.1)
    expect((0.2 - next.offsetX / 100 * 2) / next.zoom).toBeCloseTo((0.2 - before.offsetX / 100 * 2) / before.zoom)
    expect((-0.1 - next.offsetY / 100) / next.zoom).toBeCloseTo((-0.1 - before.offsetY / 100) / before.zoom)
  })

  it("clamps to visible bounds and reverses immediately without a dead zone", () => {
    const edge = dragCrop(crop, 1.5, 0.75, 300, 400, 10000, 10000)
    const back = dragCrop(edge, 1.5, 0.75, 300, 400, -6, -4)
    expect(back.offsetX).toBeCloseTo(edge.offsetX - 1)
    expect(back.offsetY).toBeCloseTo(edge.offsetY - 1)
    const reset = zoomCrop(edge, 1.5, 0.75, 0)
    expect(reset.zoom).toBe(1)
    expect(reset.offsetY).toBe(0)
    expect(zoomCrop(crop, 1.5, 0.75, 99).zoom).toBe(4)
  })

  it("keeps the frame covered for portrait, landscape and point-top hexagon", () => {
    for (const source of [0.5, 1, 2]) for (const target of [0.75, 4 / 3, Math.sqrt(3) / 2]) {
      const { width, height, crop: result } = cropGeometry(source, target, { ...crop, offsetX: 100, offsetY: -100 })
      expect(width * result.zoom / 2 - Math.abs(result.offsetX / 100 * width)).toBeGreaterThanOrEqual(0.5 - 1e-10)
      expect(height * result.zoom / 2 - Math.abs(result.offsetY / 100 * height)).toBeGreaterThanOrEqual(0.5 - 1e-10)
    }
  })
})
