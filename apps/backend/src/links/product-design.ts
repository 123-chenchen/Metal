import { defineLink } from "@medusajs/framework/utils"
import ProductModule from "@medusajs/medusa/product"
import DesignModule from "../modules/design"

export default defineLink(
  { linkable: ProductModule.linkable.product, field: "id", isList: true },
  { ...DesignModule.linkable.design.id, primaryKey: "product_id" },
  { readOnly: true }
)
