"use client"

import { useCallback, useEffect, useState } from "react"
import { sdk } from "@lib/config"

const GUEST_ID_KEY = "wishlist_guest_id"
const WISHLIST_EVENT = "wishlist:change"

export type WishlistEntry = {
  product_id: string
  image_index: number
  design_id?: string | null
}

function getGuestId(): string {
  if (typeof window === "undefined") {
    return ""
  }

  let id = localStorage.getItem(GUEST_ID_KEY)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(GUEST_ID_KEY, id)
  }

  return id
}

function entryKey(productId: string, imageIndex: number, designId?: string | null) {
  return `${productId}:${designId ?? imageIndex}`
}

let cachedEntries: WishlistEntry[] | null = null
let inFlight: Promise<WishlistEntry[]> | null = null

async function fetchWishlistEntries(): Promise<WishlistEntry[]> {
  const response = await sdk.client.fetch<{ items: WishlistEntry[] }>(
    "/store/wishlist",
    {
      method: "GET",
      query: { guest_id: getGuestId() },
    }
  )

  return response.items ?? []
}

function setCache(entries: WishlistEntry[]) {
  cachedEntries = entries
  window.dispatchEvent(new CustomEvent(WISHLIST_EVENT))
}

export function useWishlist() {
  const [entries, setEntries] = useState<WishlistEntry[]>(cachedEntries ?? [])
  const [loaded, setLoaded] = useState(!!cachedEntries)

  const refresh = useCallback(async () => {
    if (!inFlight) {
      inFlight = fetchWishlistEntries().finally(() => {
        inFlight = null
      })
    }

    const result = await inFlight
    setCache(result)
    setLoaded(true)
    return result
  }, [])

  useEffect(() => {
    if (!cachedEntries) {
      refresh()
    } else {
      setLoaded(true)
    }

    const handler = () => setEntries(cachedEntries ?? [])
    window.addEventListener(WISHLIST_EVENT, handler)
    return () => window.removeEventListener(WISHLIST_EVENT, handler)
  }, [refresh])

  const isWishlisted = useCallback(
    (productId: string, imageIndex: number, designId?: string) =>
      entries.some(
        (entry) =>
          entryKey(entry.product_id, entry.image_index, entry.design_id) === entryKey(productId, imageIndex, designId)
      ),
    [entries]
  )

  const add = useCallback(async (productId: string, imageIndex: number, designId?: string) => {
    const previous = cachedEntries ?? []
    if (
      previous.some(
        (entry) =>
          entryKey(entry.product_id, entry.image_index, entry.design_id) === entryKey(productId, imageIndex, designId)
      )
    ) {
      return
    }

    setCache([...previous, { product_id: productId, image_index: imageIndex, design_id: designId }])

    try {
      await sdk.client.fetch("/store/wishlist", {
        method: "POST",
        body: {
          product_id: productId,
          image_index: imageIndex,
          design_id: designId,
          guest_id: getGuestId(),
        },
      })
    } catch (error) {
      setCache(previous)
      throw error
    }
  }, [])

  const remove = useCallback(
    async (productId: string, imageIndex: number, designId?: string) => {
      const previous = cachedEntries ?? []
      setCache(
        previous.filter(
          (entry) =>
            !(
              entryKey(entry.product_id, entry.image_index, entry.design_id) === entryKey(productId, imageIndex, designId)
            )
        )
      )

      try {
        await sdk.client.fetch(`/store/wishlist/${productId}`, {
          method: "DELETE",
          query: { guest_id: getGuestId(), image_index: imageIndex, design_id: designId },
        })
      } catch (error) {
        setCache(previous)
        throw error
      }
    },
    []
  )

  const toggle = useCallback(
    async (productId: string, imageIndex: number, designId?: string) => {
      const key = entryKey(productId, imageIndex, designId)
      const active = (cachedEntries ?? []).some(
        (entry) => entryKey(entry.product_id, entry.image_index, entry.design_id) === key
      )

      if (active) {
        await remove(productId, imageIndex, designId)
      } else {
        await add(productId, imageIndex, designId)
      }
    },
    [add, remove]
  )

  return { entries, loaded, isWishlisted, add, remove, toggle, refresh }
}
