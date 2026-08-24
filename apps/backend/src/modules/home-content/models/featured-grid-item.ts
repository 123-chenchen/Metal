import { model } from "@medusajs/framework/utils"

const FeaturedGridItem = model.define("featured_grid_item", {
  id: model.id().primaryKey(),
  position: model.number(),
  media_url: model.text(),
  media_file_id: model.text().nullable(),
  media_type: model.enum(["image", "video"]).default("image"),
  link_type: model.enum(["collection", "category"]),
  link_value: model.text(),
  title: model.text().nullable(),
})

export default FeaturedGridItem
