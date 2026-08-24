import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import HomeContentModuleService from "../../../modules/home-content/service"
import { HOME_CONTENT_MODULE } from "../../../modules/home-content"

export async function GET(req: MedusaRequest, res: MedusaResponse): Promise<void> {
  const homeContentModuleService: HomeContentModuleService = req.scope.resolve(
    HOME_CONTENT_MODULE
  )

  const [heroBanners, gridItems] = await Promise.all([
    homeContentModuleService.listHeroBanners(
      {},
      { order: { position: "ASC" } }
    ),
    homeContentModuleService.listFeaturedGridItems(
      {},
      { order: { position: "ASC" } }
    ),
  ])

  res.status(200).json({
    hero_slides: heroBanners.map((hero) => ({
      id: hero.id,
      image_url: hero.image_url,
      heading: hero.heading,
      subheading: hero.subheading,
      kicker: hero.kicker,
      link_type: hero.link_type,
      link_value: hero.link_value,
    })),
    grid_items: gridItems.map((item) => ({
        position: item.position,
        media_url: item.media_url,
        media_type: item.media_type,
        link_type: item.link_type,
        link_value: item.link_value,
        title: item.title,
      })),
  })
}
