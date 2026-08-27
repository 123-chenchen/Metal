import { Metadata } from "next"

import FeaturedGrid from "@modules/home/components/featured-grid"
import FeaturesBar from "@modules/home/components/features-bar"
import Hero from "@modules/home/components/hero"
import { getHomeContent } from "@lib/data/home-content"
import { getRegion } from "@lib/data/regions"

export const metadata: Metadata = {
  title: "AniMetal Poster — Premium Metal Art for Anime Fans",
  description:
    "Waterproof, scratch-proof metal-printed posters for anime and gaming fans. Damage-free mounting, ultra-HD prints.",
}

export default async function Home(props: {
  params: Promise<{ countryCode: string }>
}) {
  const params = await props.params

  const { countryCode } = params

  const region = await getRegion(countryCode)

  if (!region) {
    return null
  }

  const homeContent = await getHomeContent()

  return (
    <>
      <Hero slides={homeContent?.hero_slides ?? []} />
      <FeaturesBar />
      <FeaturedGrid items={homeContent?.grid_items ?? []} />
    </>
  )
}
