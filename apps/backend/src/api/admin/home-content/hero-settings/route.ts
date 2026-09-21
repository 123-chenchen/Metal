import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { homeHeroSchema } from "../../../../lib/home-hero"
import { saveHomeHeroWorkflow } from "../../../../workflows/save-home-hero"

export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const parsed = homeHeroSchema.safeParse(req.body)
  if (!parsed.success) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      parsed.error.issues
        .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
        .join("; ")
    )
  }
  const { result } = await saveHomeHeroWorkflow(req.scope).run({
    input: parsed.data,
  })
  res.json({ hero_config: result })
}
