import { getHomeHeroConfig, homeHeroSchema } from "../home-hero"

const legacySlides = [
  {
    id: "hero_1",
    image_url: "https://example.com/banner.jpg",
    image_file_id: "file_1",
    link_type: "collection",
    link_value: "anime",
  },
]

describe("home banner configuration", () => {
  it("keeps existing banners and their destinations when no new config exists", () => {
    const config = getHomeHeroConfig(undefined, legacySlides)
    expect(config.media_slides[0]).toMatchObject({
      id: "hero_1",
      media_url: legacySlides[0].image_url,
      media_file_id: "file_1",
      link_url: "/collections/anime",
    })
    expect(homeHeroSchema.safeParse(config).success).toBe(true)
  })

  it("keeps a saved empty carousel empty instead of reviving old banners", () => {
    const config = getHomeHeroConfig(undefined, [])
    expect(getHomeHeroConfig(config, legacySlides).media_slides).toEqual([])
  })

  it("preserves custom dimensions, videos, positions and destinations on save/load", () => {
    const config = getHomeHeroConfig(undefined, legacySlides)
    config.media_aspect_ratio = "custom"
    config.media_slides[0].media_aspect_ratio = "4 / 3"
    config.width = 1920
    config.height = 600
    config.slide_interval_seconds = 8
    config.media_slides[0] = {
      ...config.media_slides[0],
      media_type: "video",
      media_object_position: "center top",
      media_url: "https://example.com/banner.mp4",
      link_url: "/custom/wall",
    }
    expect(
      getHomeHeroConfig(homeHeroSchema.parse(config), legacySlides)
    ).toEqual(config)
  })

  it.each([
    "javascript:alert(1)",
    "//evil.example",
    "/\\evil.example",
    "data:text/html,test",
  ])("rejects unsafe destination %s", (link) => {
    const config = getHomeHeroConfig(undefined, legacySlides)
    config.media_slides[0].link_url = link
    expect(homeHeroSchema.safeParse(config).success).toBe(false)
  })

  it.each(["", "/", "/products/anime?size=m", "https://example.com/page"])(
    "accepts destination %s",
    (link) => {
      const config = getHomeHeroConfig(undefined, legacySlides)
      config.media_slides[0].link_url = link
      expect(homeHeroSchema.safeParse(config).success).toBe(true)
    }
  )

  it("rejects invalid dimensions and autoplay intervals", () => {
    const config = getHomeHeroConfig(undefined, [])
    expect(homeHeroSchema.safeParse({ ...config, height: 0 }).success).toBe(
      false
    )
    expect(
      homeHeroSchema.safeParse({ ...config, slide_interval_seconds: 1 }).success
    ).toBe(false)
  })
})
