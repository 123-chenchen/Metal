import { Metadata } from "next"
import { Suspense } from "react"

import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"
import PaginatedProducts from "@modules/store/templates/paginated-products"

export const metadata: Metadata = {
  title: "Search",
  description: "Search results.",
}

type Params = {
  params: Promise<{ countryCode: string }>
  searchParams: Promise<{ q?: string; page?: string }>
}

export default async function SearchPage(props: Params) {
  const params = await props.params
  const searchParams = await props.searchParams

  const q = (searchParams.q ?? "").trim()
  const page = searchParams.page ? parseInt(searchParams.page) : 1

  return (
    <div className="py-6 content-container-wide">
      <div className="mb-8 text-2xl-semi">
        <h1>{q ? `Search results for "${q}"` : "Search"}</h1>
      </div>

      {q ? (
        <Suspense fallback={<SkeletonProductGrid />}>
          <PaginatedProducts
            sortBy="created_at"
            page={page}
            countryCode={params.countryCode}
            q={q}
          />
        </Suspense>
      ) : (
        <p className="text-ui-fg-subtle">
          Enter a search term to find products.
        </p>
      )}
    </div>
  )
}
