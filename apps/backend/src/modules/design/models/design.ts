import { model } from "@medusajs/framework/utils"

const Design = model.define("design", {
  id: model.id({ prefix: "design" }).primaryKey(),
  product_id: model.text(),
  sequence: model.number(),
  title: model.text(),
  handle: model.text().unique(),
  active: model.boolean().default(true),
  archived: model.boolean().default(false),
  version: model.number().default(1),
  legacy_image_id: model.text().nullable(),
  legacy_index: model.number().nullable(),
  artwork_url: model.text(),
  artwork_file_id: model.text().nullable(),
  shape: model.enum(["original", "vertical", "horizontal", "hexagon", "multi-panel"]).default("vertical"),
  crop: model.json(),
  gallery: model.json(),
  // Retired assets remain referenced for historical cart/order snapshots.
  retained_urls: model.json(),
  request_key: model.text().unique(),
}).indexes([
  { on: ["product_id", "sequence"], unique: true },
  { on: ["product_id", "legacy_image_id"], unique: true },
])

export default Design
