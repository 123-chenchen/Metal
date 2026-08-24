"use server"

import { sdk } from "@lib/config"
import { getCacheOptions } from "./cookies"

export type HomeHeroContent = {
  id: string
  image_url: string
  heading: string | null
  subheading: string | null
  kicker: string | null
  link_type: "none" | "collection" | "category"
  link_value: string | null
}

export type HomeGridItemContent = {
  position: number
  media_url: string
  media_type: "image" | "video"
  link_type: "collection" | "category"
  link_value: string
  title: string | null
}

export type HomeContentResponse = {
  hero_slides: HomeHeroContent[]
  grid_items: HomeGridItemContent[]
}

export const getHomeContent = async (): Promise<HomeContentResponse | null> => {
  const next = {
    ...(await getCacheOptions("home_content")),
    revalidate: 60,
  }

  return sdk.client
    .fetch<HomeContentResponse>(`/store/home-content`, {
      method: "GET",
      next,
    })
    .catch(() => null)
}
