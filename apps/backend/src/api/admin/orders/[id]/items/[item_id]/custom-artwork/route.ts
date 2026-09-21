import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { exportOrderCustomArtworkWorkflow } from "../../../../../../../workflows/export-order-custom-artwork"

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const { result } = await exportOrderCustomArtworkWorkflow(req.scope).run({
    input: { order_id: req.params.id, item_id: req.params.item_id },
  })
  const filename = `custom-${req.params.item_id.replace(/[^a-zA-Z0-9_-]/g, "")}-cropped.png`
  res.setHeader("Content-Type", "image/png")
  res.setHeader("Content-Disposition", `inline; filename="${filename}"`)
  res.setHeader("Cache-Control", "private, max-age=300")
  res.setHeader("X-Content-Type-Options", "nosniff")
  res.status(200).send(Buffer.from(result.content, "base64"))
}
