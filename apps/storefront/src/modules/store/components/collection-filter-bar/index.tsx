"use client"

import { useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { catalogFilterQuery } from "@lib/util/catalog-filter-query"
import { ChevronDownMini } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import clsx from "clsx"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import RefinementList from "@modules/store/components/refinement-list"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"

type CollectionFilterBarProps = {
  sortBy: SortOptions
  collections: HttpTypes.StoreCollection[]
  categories?: HttpTypes.StoreProductCategory[]
  categoryId?: string
  collectionId?: string
  hideOptionsPicker?: boolean
  "data-testid"?: string
}

const CollectionFilterBar = ({
  sortBy,
  collections,
  categories,
  categoryId,
  collectionId,
  hideOptionsPicker,
  "data-testid": dataTestId,
}: CollectionFilterBarProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const isCategoryPage = pathname.includes("/categories/")
  const changeFilter = (key: "collection_id" | "category_id", value: string) => {
    const query = catalogFilterQuery(searchParams.toString(), key, value)
    router.push(query ? `${pathname}?${query}` : pathname)
  }

  const tabs = [
    { label: "All", href: "/store", handle: null as string | null, id: "" },
    ...collections.map((collection) => ({
      label: collection.title,
      href: `/collections/${collection.handle}`,
      handle: collection.handle,
      id: collection.id,
    })),
  ]

  return (
    <>
      <div className="w-full border-b border-ui-border-base bg-ui-bg-base">
        <div className="content-container-wide flex items-center gap-4 py-3">
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="flex shrink-0 items-center gap-1.5 txt-compact-small-plus uppercase tracking-wide text-ui-fg-base hover:text-ui-fg-interactive transition-colors"
            aria-haspopup="true"
            aria-expanded={isOpen}
            data-testid="collection-filter-button"
          >
            Filter
            <ChevronDownMini />
          </button>

          <div className="h-5 w-px shrink-0 bg-ui-border-base" />

          {categories && (
            <label className="flex shrink-0 items-center gap-2 text-sm">
              <span>Category</span>
              <select aria-label="Filter by category" value={categoryId ?? ""} onChange={(event) => changeFilter("category_id", event.target.value)} className="max-w-48 rounded border border-ui-border-base bg-ui-bg-base px-2 py-1">
                <option value="">All categories</option>
                {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
              </select>
            </label>
          )}

          <div className="flex items-center gap-6 overflow-x-auto no-scrollbar">
            {tabs.map((tab) => {
              const isActive = isCategoryPage ? (collectionId ?? "") === tab.id : tab.handle
                ? pathname.includes(`/collections/${tab.handle}`)
                : pathname.endsWith("/store")

              if (isCategoryPage) return (
                <button key={tab.id} type="button" onClick={() => changeFilter("collection_id", tab.id)} aria-pressed={isActive} className={clsx("shrink-0 whitespace-nowrap txt-compact-small-plus pb-0.5 border-b-2 transition-colors", isActive ? "border-metal-gold text-ui-fg-base" : "border-transparent text-ui-fg-subtle hover:text-ui-fg-base")}>
                  {tab.label}
                </button>
              )
              const query = new URLSearchParams(searchParams.toString())
              query.delete("page")
              query.delete("collection_id")
              // Store has no category filter; do not carry an invisible constraint there.
              if (!tab.handle) query.delete("category_id")
              const href = query.size ? `${tab.href}?${query}` : tab.href
              return (
                <LocalizedClientLink
                  key={tab.id}
                  href={href}
                  className={clsx(
                    "shrink-0 whitespace-nowrap txt-compact-small-plus pb-0.5 border-b-2 transition-colors",
                    isActive
                      ? "border-metal-gold text-ui-fg-base"
                      : "border-transparent text-ui-fg-subtle hover:text-ui-fg-base"
                  )}
                >
                  {tab.label}
                </LocalizedClientLink>
              )
            })}
          </div>
        </div>
      </div>

      <RefinementList
        sortBy={sortBy}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        hideOptionsPicker={hideOptionsPicker}
        data-testid={dataTestId}
      />
    </>
  )
}

export default CollectionFilterBar
