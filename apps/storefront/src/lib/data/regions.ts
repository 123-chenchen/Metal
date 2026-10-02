"use server"

import { sdk } from "@lib/config"
import { HttpTypes } from "@medusajs/types"

export const listRegions = async () => {
  return await sdk.client
    .fetch<{ regions: HttpTypes.StoreRegion[] }>(`/store/regions`, {
      method: "GET",
      cache: "no-store",
    })
    .then(({ regions }) => regions)
}

export const retrieveRegion = async (id: string) => {
  return await sdk.client
    .fetch<{ region: HttpTypes.StoreRegion }>(`/store/regions/${id}`, {
      method: "GET",
      cache: "no-store",
    })
    .then(({ region }) => region)
}

export const getRegion = async (countryCode: string) => {
  // Resolve against current Admin settings, including country reassignment.
  // A process-level map survives Next.js cache invalidation.
  const regions = await listRegions()

  if (!regions) {
    return null
  }

  const country = (countryCode || "us").toLowerCase()
  return regions.find((region) =>
    region.countries?.some((c) => c.iso_2?.toLowerCase() === country)
  )
}
