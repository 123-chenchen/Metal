"use client"

import { useCallback, useEffect, useState } from "react"
import { sdk } from "@lib/config"

const GUEST_ID_KEY = "wishlist_guest_id"
const WISHLIST_EVENT = "wishlist:change"

export type WishlistEntry = {
  product_id: string
  image_index: number
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

function entryKey(productId: string, imageIndex: number) {
  return `${productId}:${imageIndex}`
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
    (productId: string, imageIndex: number) =>
      entries.some(
        (entry) =>
          entry.product_id === productId && entry.image_index === imageIndex
      ),
    [entries]
  )

  const add = useCallback(async (productId: string, imageIndex: number) => {
    const previous = cachedEntries ?? []
    if (
      previous.some(
        (entry) =>
          entry.product_id === productId && entry.image_index === imageIndex
      )
    ) {
      return
    }

    setCache([...previous, { product_id: productId, image_index: imageIndex }])

    try {
      await sdk.client.fetch("/store/wishlist", {
        method: "POST",
        body: {
          product_id: productId,
          image_index: imageIndex,
          guest_id: getGuestId(),
        },
      })
    } catch (error) {
      setCache(previous)
      throw error
    }
  }, [])

  const remove = useCallback(
    async (productId: string, imageIndex: number) => {
      const previous = cachedEntries ?? []
      setCache(
        previous.filter(
          (entry) =>
            !(
              entry.product_id === productId &&
              entry.image_index === imageIndex
            )
        )
      )

      try {
        await sdk.client.fetch(`/store/wishlist/${productId}`, {
          method: "DELETE",
          query: { guest_id: getGuestId(), image_index: imageIndex },
        })
      } catch (error) {
        setCache(previous)
        throw error
      }
    },
    []
  )

  const toggle = useCallback(
    async (productId: string, imageIndex: number) => {
      const key = entryKey(productId, imageIndex)
      const active = (cachedEntries ?? []).some(
        (entry) => entryKey(entry.product_id, entry.image_index) === key
      )

      if (active) {
        await remove(productId, imageIndex)
      } else {
        await add(productId, imageIndex)
      }
    },
    [add, remove]
  )

  return { entries, loaded, isWishlisted, add, remove, toggle, refresh }
}
