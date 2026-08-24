"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"
import { ChevronDownMini } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import clsx from "clsx"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import RefinementList from "@modules/store/components/refinement-list"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"

type CollectionFilterBarProps = {
  sortBy: SortOptions
  collections: HttpTypes.StoreCollection[]
  hideOptionsPicker?: boolean
  "data-testid"?: string
}

const CollectionFilterBar = ({
  sortBy,
  collections,
  hideOptionsPicker,
  "data-testid": dataTestId,
}: CollectionFilterBarProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  const tabs = [
    { label: "All", href: "/store", handle: null as string | null },
    ...collections.map((collection) => ({
      label: collection.title,
      href: `/collections/${collection.handle}`,
      handle: collection.handle,
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

          <div className="flex items-center gap-6 overflow-x-auto no-scrollbar">
            {tabs.map((tab) => {
              const isActive = tab.handle
                ? pathname.includes(`/collections/${tab.handle}`)
                : pathname.endsWith("/store")

              return (
                <LocalizedClientLink
                  key={tab.label}
                  href={tab.href}
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
