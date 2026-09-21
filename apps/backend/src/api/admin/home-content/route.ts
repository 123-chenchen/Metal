import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import HomeContentModuleService from "../../../modules/home-content/service"
import { HOME_CONTENT_MODULE } from "../../../modules/home-content"
import { getHomeHeroConfig } from "../../../lib/home-hero"

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const homeContentModuleService: HomeContentModuleService =
    req.scope.resolve(HOME_CONTENT_MODULE)

  const [heroBanners, gridItems, promoBars, settings] = await Promise.all([
    homeContentModuleService.listHeroBanners(
      {},
      { order: { position: "ASC" } }
    ),
    homeContentModuleService.listFeaturedGridItems(
      {},
      { order: { position: "ASC" } }
    ),
    homeContentModuleService.listPromoBars({}, { take: 1 }),
    homeContentModuleService.listHeroSettings({ id: "home-hero-settings" }),
  ])

  res.status(200).json({
    hero_slides: heroBanners,
    hero_config: getHomeHeroConfig(settings[0]?.config, heroBanners),
    grid_items: gridItems,
    promo_bar: promoBars[0] ?? null,
  })
}
