const mockRun = jest.fn()
jest.mock("../../workflows/export-order-custom-artwork", () => ({
  exportOrderCustomArtworkWorkflow: () => ({ run: mockRun }),
}))

import { GET } from "../../api/admin/orders/[id]/items/[item_id]/custom-artwork/route"

it("opens the order item's cropped PNG inline with a saveable filename", async () => {
  const image = Buffer.from([137, 80, 78, 71])
  mockRun.mockResolvedValue({ result: { content: image.toString("base64") } })
  const req = { scope: {}, params: { id: "order_1", item_id: "item_2" } }
  const res = {
    setHeader: jest.fn(),
    status: jest.fn().mockReturnThis(),
    send: jest.fn(),
  }
  await GET(req as never, res as never)
  expect(mockRun).toHaveBeenCalledWith({
    input: { order_id: "order_1", item_id: "item_2" },
  })
  expect(res.setHeader).toHaveBeenCalledWith("Content-Type", "image/png")
  expect(res.setHeader).toHaveBeenCalledWith(
    "Content-Disposition",
    'inline; filename="custom-item_2-cropped.png"'
  )
  expect(res.send).toHaveBeenCalledWith(image)
})
