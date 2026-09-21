import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { addToCartWorkflow } from "@medusajs/medusa/core-flows"
import { resolveCartDesign } from "../lib/design-cart"

type Item = {
  variant_id: string
  quantity: number
  metadata?: Record<string, unknown>
}
type Input = { cart_id: string; items: Item[] }

const resolveWallDesignsStep = createStep(
  "resolve-wall-designs",
  async (items: Item[], { container }) => {
    const resolved = await Promise.all(
      items.map(async (item) => {
        if (
          !item.metadata ||
          !(
            "selected_image_index" in item.metadata ||
            "selected_design_id" in item.metadata
          )
        )
          return item
        return {
          ...item,
          metadata: await resolveCartDesign(
            container,
            item.variant_id,
            item.metadata
          ),
        }
      })
    )
    return new StepResponse(resolved)
  }
)

export const addCustomCartItemsWorkflow = createWorkflow(
  "add-custom-cart-items",
  (input: Input) => {
    const items = resolveWallDesignsStep(input.items)
    const result = addToCartWorkflow.runAsStep({
      input: { cart_id: input.cart_id, items },
    })
    return new WorkflowResponse(result)
  }
)
