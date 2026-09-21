import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { DESIGN_MODULE } from "../../../../../modules/design"
import DesignModuleService from "../../../../../modules/design/service"
import { designCommandSchema } from "../../../../../lib/designs"
import { manageDesignsWorkflow } from "../../../../../workflows/manage-designs"

export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse): Promise<void> {
  const service = req.scope.resolve<DesignModuleService>(DESIGN_MODULE)
  const designs = await service.listDesigns({ product_id: req.params.id }, { order: { sequence: "ASC" }, take: null })
  res.json({ designs })
}

export async function POST(req: AuthenticatedMedusaRequest, res: MedusaResponse): Promise<void> {
  const parsed = designCommandSchema.safeParse(req.body)
  if (!parsed.success) throw new MedusaError(MedusaError.Types.INVALID_DATA, parsed.error.issues[0]?.message ?? "Invalid design command")
  const { result } = await manageDesignsWorkflow(req.scope).run({ input: { product_id: req.params.id, command: parsed.data } })
  res.json(result)
}
