import { MedusaService } from "@medusajs/framework/utils"
import Design from "./models/design"
import DesignAsset from "./models/design-asset"

class DesignModuleService extends MedusaService({ Design, DesignAsset }) {}

export default DesignModuleService
