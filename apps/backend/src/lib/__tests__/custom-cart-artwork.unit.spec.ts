const mockRun = jest.fn().mockResolvedValue({})
jest.mock("../../workflows/add-custom-cart-items", () => ({
  addCustomCartItemsWorkflow: () => ({ run: mockRun }),
}))

import { POST } from "../../api/store/custom/cart/route"

describe("custom cart artwork metadata", () => {
  it("keeps different designs of one variant separate and combines repeat selections", async () => {
    const req = {
      scope: {},
      body: {
        cart_id: "cart_test",
        items: [
          {
            source: "product",
            variant_id: "variant_1",
            quantity: 1,
            selected_design_id: "design_a",
            selected_image_index: 1,
            image_url: "/a.png",
            display_title: "Design A",
          },
          {
            source: "product",
            variant_id: "variant_1",
            quantity: 1,
            selected_design_id: "design_b",
            selected_image_index: 2,
            image_url: "/b.png",
            display_title: "Design B",
          },
          {
            source: "product",
            variant_id: "variant_1",
            quantity: 1,
            selected_design_id: "design_a",
            selected_image_index: 1,
            image_url: "/a.png",
            display_title: "Design A",
          },
        ],
      },
    }
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() }
    await POST(req as never, res as never)
    const { input } = mockRun.mock.calls.at(-1)![0]
    expect(input.items).toHaveLength(2)
    expect(input.items[0]).toMatchObject({
      quantity: 2,
      metadata: {
        selected_design_id: "design_a",
        selected_image_url: "/a.png",
      },
    })
    expect(input.items[1]).toMatchObject({
      quantity: 1,
      metadata: {
        selected_design_id: "design_b",
        selected_image_url: "/b.png",
      },
    })
  })

  it("keeps legacy image selections separate even without design IDs", async () => {
    const req = {
      scope: {},
      body: {
        cart_id: "cart_test",
        items: [1, 2].map((index) => ({
          source: "product",
          variant_id: "variant_1",
          quantity: 1,
          selected_image_index: index,
        })),
      },
    }
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() }
    await POST(req as never, res as never)
    expect(mockRun.mock.calls.at(-1)![0].input.items).toHaveLength(2)
  })

  it.each(["custom_standard", "custom_hexagon", "custom_wall"])(
    "preserves both images and crop on %s line items for checkout",
    async (source) => {
      const crop = { offsetX: 20, offsetY: -10, zoom: 2, imageRatio: 1.5 }
      const req = {
        scope: {},
        body: {
          cart_id: "cart_test",
          items: [
            {
              source,
              variant_id: "variant_test",
              quantity: 1,
              image_url: "https://storage.example/original.jpg",
              cropped_image_url: "https://storage.example/cropped.png",
              original_filename: "customer.jpg",
              crop,
            },
          ],
        },
      }
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() }
      await POST(req as never, res as never)
      expect(mockRun).toHaveBeenLastCalledWith({
        input: {
          cart_id: "cart_test",
          items: [
            expect.objectContaining({
              metadata: expect.objectContaining({
                custom_image_url: "https://storage.example/original.jpg",
                custom_cropped_image_url: "https://storage.example/cropped.png",
                custom_original_filename: "customer.jpg",
                custom_crop: crop,
              }),
            }),
          ],
        },
      })
    }
  )
})
