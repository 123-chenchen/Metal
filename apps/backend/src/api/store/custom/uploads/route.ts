import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import {
  uploadCustomArtworkWorkflow,
  UploadPayload,
} from "../../../../workflows/upload-custom-artwork"

export async function POST(
  req: MedusaRequest<UploadPayload>,
  res: MedusaResponse
): Promise<void> {
  const { result } = await uploadCustomArtworkWorkflow(req.scope).run({
    input: req.body,
  })
  res.status(200).json(result)
}
