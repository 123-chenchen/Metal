import { MedusaService } from "@medusajs/framework/utils"
import HeroBanner from "./models/hero-banner"
import FeaturedGridItem from "./models/featured-grid-item"

class HomeContentModuleService extends MedusaService({
  HeroBanner,
  FeaturedGridItem,
}) {}

export default HomeContentModuleService
