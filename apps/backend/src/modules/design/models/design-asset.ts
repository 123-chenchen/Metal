import { model } from "@medusajs/framework/utils"

// Assets are retained independently of catalog visibility for order history.
const DesignAsset = model.define("design_asset", {
  id: model.id({ prefix: "dasset" }).primaryKey(),
  url: model.text().unique(),
  file_id: model.text().nullable(),
})

export default DesignAsset
