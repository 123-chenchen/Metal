"use server"

import { sdk } from "@lib/config"

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

export type HomePromoBarContent = {
  text: string
}

export type HomeContentResponse = {
  hero_config: HomeHeroConfig
  hero_slides: HomeHeroContent[]
  grid_items: HomeGridItemContent[]
  promo_bar: HomePromoBarContent | null
}

export type HomeHeroSlide = {
  media_aspect_ratio?: "16 / 9" | "4 / 3" | "1 / 1" | "21 / 9"
  id: string
  media_type: "image" | "video"
  media_url: string
  media_object_position: string
  link_url: string
}

export type HomeHeroConfig = {
  media_aspect_ratio:
    "auto" | "16 / 9" | "4 / 3" | "1 / 1" | "21 / 9" | "custom"
  width: number
  height: number
  slide_interval_seconds: number
  media_slides: HomeHeroSlide[]
}

export const getHomeContent = async (): Promise<HomeContentResponse | null> => {
  return sdk.client
    .fetch<HomeContentResponse>(`/store/home-content`, {
      method: "GET",
      cache: "no-store",
    })
    .catch(() => null)
}
