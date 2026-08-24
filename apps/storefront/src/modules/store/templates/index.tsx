import { Suspense } from "react"

import { listCollections } from "@lib/data/collections"
import { OptionValueIds } from "@lib/util/product-option-filters"
import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"
import CollectionFilterBar from "@modules/store/components/collection-filter-bar"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"

import PaginatedProducts from "./paginated-products"

const StoreTemplate = async ({
  sortBy,
  page,
  countryCode,
  optionValueIds,
}: {
  sortBy?: SortOptions
  page?: string
  countryCode: string
  optionValueIds?: OptionValueIds
}) => {
  const pageNumber = page ? parseInt(page) : 1
  const sort = sortBy || "created_at"
  const { collections } = await listCollections()

  return (
    <>
      <CollectionFilterBar
        sortBy={sort}
        collections={collections}
        data-testid="sort-by-container"
      />
      <div className="py-6 content-container-wide" data-testid="category-container">
        <Suspense fallback={<SkeletonProductGrid />}>
          <PaginatedProducts
            sortBy={sort}
            page={pageNumber}
            countryCode={countryCode}
            optionValueIds={optionValueIds}
          />
        </Suspense>
      </div>
    </>
  )
}

export default StoreTemplate
