import { Suspense } from "react"

import { listCategories } from "@lib/data/categories"
import { listCollections } from "@lib/data/collections"
import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"
import CollectionFilterBar from "@modules/store/components/collection-filter-bar"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import PaginatedProducts from "@modules/store/templates/paginated-products"
import { HttpTypes } from "@medusajs/types"
import { OptionValueIds } from "@lib/util/product-option-filters"

export default async function CollectionTemplate({
  sortBy,
  collection,
  page,
  countryCode,
  optionValueIds,
  categoryId,
}: {
  sortBy?: SortOptions
  collection: HttpTypes.StoreCollection
  page?: string
  countryCode: string
  categoryId?: string
  optionValueIds?: OptionValueIds
}) {
  const pageNumber = page ? parseInt(page) : 1
  const sort = sortBy || "created_at"
  const [{ collections }, categories] = await Promise.all([listCollections(), listCategories()])

  return (
    <>
      <CollectionFilterBar sortBy={sort} collections={collections} categories={categories} collectionId={collection.id} categoryId={categoryId} hideOptionsPicker />
      <div className="py-6 content-container-wide">
        <h1 className="mb-8 text-2xl-semi">{collection.title}</h1>
        <Suspense
          fallback={
            <SkeletonProductGrid
              numberOfProducts={collection.products?.length}
            />
          }
        >
          <PaginatedProducts
            sortBy={sort}
            page={pageNumber}
            collectionId={collection.id}
            categoryId={categoryId}
            countryCode={countryCode}
            optionValueIds={optionValueIds}
          />
        </Suspense>
      </div>
    </>
  )
}
