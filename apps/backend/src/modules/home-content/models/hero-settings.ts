import { model } from "@medusajs/framework/utils"

const HeroSettings = model.define("hero_settings", {
  id: model.id().primaryKey(),
  config: model.json(),
})

export default HeroSettings
