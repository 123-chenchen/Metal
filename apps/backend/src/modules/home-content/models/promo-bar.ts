import { model } from "@medusajs/framework/utils"

const PromoBar = model.define("promo_bar", {
  id: model.id().primaryKey(),
  text: model.text(),
  is_active: model.boolean().default(true),
})

export default PromoBar
