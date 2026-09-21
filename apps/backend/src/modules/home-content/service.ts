import { MedusaService } from "@medusajs/framework/utils"
import HeroBanner from "./models/hero-banner"
import FeaturedGridItem from "./models/featured-grid-item"
import PromoBar from "./models/promo-bar"
import HeroSettings from "./models/hero-settings"

class HomeContentModuleService extends MedusaService({
  HeroBanner,
  FeaturedGridItem,
  PromoBar,
  HeroSettings,
}) {}

export default HomeContentModuleService
