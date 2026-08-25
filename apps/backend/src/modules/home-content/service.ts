import { MedusaService } from "@medusajs/framework/utils"
import HeroBanner from "./models/hero-banner"
import FeaturedGridItem from "./models/featured-grid-item"
import PromoBar from "./models/promo-bar"

class HomeContentModuleService extends MedusaService({
  HeroBanner,
  FeaturedGridItem,
  PromoBar,
}) {}

export default HomeContentModuleService
