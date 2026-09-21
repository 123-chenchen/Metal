"use server"

import { sdk } from "@lib/config"
import { OptionValueIds } from "@lib/util/product-option-filters"
import { sortProducts } from "@lib/util/sort-products"
import { HttpTypes } from "@medusajs/types"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import { getAuthHeaders, getCacheOptions } from "./cookies"
import { getRegion, retrieveRegion } from "./regions"
import { flattenProductImages } from "@lib/util/flatten-product-images"

type ProductListQueryParams = (HttpTypes.FindParams &
  HttpTypes.StoreProductListParams) & {
  options?: string[]
  option_value_id?: string | string[]
}

export const listProducts = async ({
  pageParam = 1,
  queryParams,
  countryCode,
  regionId,
}: {
  pageParam?: number
  queryParams?: ProductListQueryParams
  countryCode?: string
  regionId?: string
}): Promise<{
  response: { products: HttpTypes.StoreProduct[]; count: number }
  nextPage: number | null
  queryParams?: ProductListQueryParams
}> => {
  if (!countryCode && !regionId) {
    throw new Error("Country code or region ID is required")
  }

  const limit = queryParams?.limit || 12
  const _pageParam = Math.max(pageParam, 1)
  const offset = _pageParam === 1 ? 0 : (_pageParam - 1) * limit

  let region: HttpTypes.StoreRegion | undefined | null

  if (countryCode) {
    region = await getRegion(countryCode)
  } else {
    region = await retrieveRegion(regionId!)
  }

  if (!region) {
    return {
      response: { products: [], count: 0 },
      nextPage: null,
    }
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  // Short revalidate window (rather than the indefinite force-cache used
  // elsewhere) so editing a product in the admin - e.g. removing an image -
  // shows up here without needing a storefront restart or manual cache
  // purge. Mirrors the fix already applied in ./payment.ts.
  const next = {
    ...(await getCacheOptions("products")),
    revalidate: 60,
  }

  return sdk.client
    .fetch<{ products: HttpTypes.StoreProduct[]; count: number }>(
      `/store/products`,
      {
        method: "GET",
        query: {
          limit,
          offset,
          region_id: region?.id,
          fields:
            "*options,*options.values,*variants.calculated_price,*variants.images,*variants.options,+metadata,+tags,+design.id,+design.product_id,+design.sequence,+design.title,+design.handle,+design.active,+design.archived,+design.legacy_index,+design.artwork_url,+design.shape,+design.crop,+design.gallery,+design.created_at",
          ...queryParams,
        },
        headers,
        next,
        cache: "force-cache",
      }
    )
    .then(({ products, count }) => {
      const nextPage = count > offset + limit ? pageParam + 1 : null

      return {
        response: {
          products,
          count,
        },
        nextPage: nextPage,
        queryParams,
      }
    })
}

// Paginate designs after native Medusa product filters/pricing. Fetch every
// matching product page; the old implementation silently stopped at 100.
export async function listDesignCards({ page = 1, queryParams, sortBy = "created_at", countryCode, optionValueIds }: {
  page?: number
  queryParams?: ProductListQueryParams
  sortBy?: SortOptions
  countryCode: string
  optionValueIds?: OptionValueIds
}) {
  const { q, limit = 12, ...filters } = queryParams ?? {}
  const products: HttpTypes.StoreProduct[] = []
  for (let parentPage = 1; ; parentPage += 1) {
    const result = await listProducts({ countryCode, pageParam: parentPage, queryParams: {
      ...filters, order: "id", limit: 100,
      ...(optionValueIds?.length ? { option_value_id: optionValueIds } : {}),
    } })
    products.push(...result.response.products)
    if (!result.nextPage || !result.response.products.length) break
  }
  const search = q?.trim().toLocaleLowerCase()
  const cards = flattenProductImages(sortProducts(products, sortBy)).filter((card) => !search ||
    `${card.designName} ${card.product.title}`.toLocaleLowerCase().includes(search))
  if (sortBy === "created_at") cards.sort((a, b) =>
    new Date(b.design?.created_at ?? b.product.created_at!).getTime() - new Date(a.design?.created_at ?? a.product.created_at!).getTime() || a.image.id.localeCompare(b.image.id))
  return { cards: cards.slice((Math.max(1, page) - 1) * limit, Math.max(1, page) * limit), count: cards.length }
}

/**
 * This will fetch 100 products to the Next.js cache and sort them based on the sortBy parameter.
 * It will then return the paginated products based on the page and limit parameters.
 */
export const listProductsWithSort = async ({
  page = 0,
  queryParams,
  sortBy = "created_at",
  countryCode,
  optionValueIds,
}: {
  page?: number
  queryParams?: ProductListQueryParams
  sortBy?: SortOptions
  countryCode: string
  optionValueIds?: OptionValueIds
}): Promise<{
  response: { products: HttpTypes.StoreProduct[]; count: number }
  nextPage: number | null
  queryParams?: ProductListQueryParams
}> => {
  const limit = queryParams?.limit || 12
  const optionFilters = Array.from(
    new Set((optionValueIds || []).filter(Boolean))
  )

  const {
    response: { products },
  } = await listProducts({
    pageParam: 0,
    queryParams: {
      ...queryParams,
      ...(optionFilters.length ? { option_value_id: optionFilters } : {}),
      limit: 100,
    },
    countryCode,
  })

  const sortedProducts = sortProducts(products, sortBy)

  const pageParam = (page - 1) * limit

  const filteredCount = products.length

  const nextPage = filteredCount > pageParam + limit ? pageParam + limit : null

  const paginatedProducts = sortedProducts.slice(pageParam, pageParam + limit)

  return {
    response: {
      products: paginatedProducts,
      count: filteredCount,
    },
    nextPage,
    queryParams,
  }
}
