import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { MedusaError, Modules } from "@medusajs/framework/utils"
import { renderCustomArtwork, CustomArtworkCrop } from "../lib/custom-artwork"
import { readCustomArtworkSource } from "../lib/custom-artwork-source"

type Input = { order_id: string; item_id: string }

const exportOrderCustomArtworkStep = createStep(
  "export-order-custom-artwork",
  async (input: Input, { container }) => {
    const order = await container
      .resolve(Modules.ORDER)
      .retrieveOrder(input.order_id, { relations: ["items"] })
    const item = order.items?.find((item) => item.id === input.item_id)
    const metadata = item?.metadata
    const crop = metadata?.custom_crop
    if (!item || !crop || typeof crop !== "object" || Array.isArray(crop)) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        "This order item has no saved crop"
      )
    }
    const source = await readCustomArtworkSource(metadata?.custom_image_url)
    const hexagon =
      metadata?.custom_type === "hexagon_poster" ||
      metadata?.custom_source === "custom_hexagon" ||
      metadata?.custom_source === "custom_wall"
    const image = await renderCustomArtwork(
      source,
      crop as CustomArtworkCrop,
      hexagon ? "hexagon" : "rectangle"
    )
    return new StepResponse({ content: image.toString("base64") })
  }
)

export const exportOrderCustomArtworkWorkflow = createWorkflow(
  "export-order-custom-artwork",
  (input: Input) => {
    return new WorkflowResponse(exportOrderCustomArtworkStep(input))
  }
)
