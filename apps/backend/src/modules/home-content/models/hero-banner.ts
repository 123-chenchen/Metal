import { model } from "@medusajs/framework/utils"

const HeroBanner = model.define("hero_banner", {
  id: model.id().primaryKey(),
  position: model.number().default(0),
  image_url: model.text(),
  image_file_id: model.text().nullable(),
  heading: model.text().nullable(),
  subheading: model.text().nullable(),
  kicker: model.text().nullable(),
  link_type: model.enum(["none", "collection", "category"]).default("none"),
  link_value: model.text().nullable(),
})

export default HeroBanner
