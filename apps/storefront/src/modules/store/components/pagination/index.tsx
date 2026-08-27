"use client"

import { ChevronLeft, ChevronRight } from "@medusajs/icons"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

const arrowButtonClassName =
  "flex h-10 w-10 items-center justify-center rounded-full border border-ui-border-base text-ui-fg-base transition-colors duration-150 hover:border-ui-border-interactive hover:bg-ui-bg-subtle disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-ui-border-base disabled:hover:bg-transparent"

export function Pagination({
  page,
  totalPages,
  "data-testid": dataTestid,
}: {
  page: number
  totalPages: number
  "data-testid"?: string
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const goToPage = (newPage: number) => {
    const params = new URLSearchParams(searchParams)
    params.set("page", newPage.toString())
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div
      className="flex w-full items-center justify-center gap-6 mt-12"
      data-testid={dataTestid}
    >
      <button
        type="button"
        onClick={() => goToPage(page - 1)}
        disabled={page <= 1}
        aria-label="Previous page"
        className={arrowButtonClassName}
      >
        <ChevronLeft />
      </button>
      <span className="txt-compact-medium text-ui-fg-subtle">
        Page {page} / {totalPages}
      </span>
      <button
        type="button"
        onClick={() => goToPage(page + 1)}
        disabled={page >= totalPages}
        aria-label="Next page"
        className={arrowButtonClassName}
      >
        <ChevronRight />
      </button>
    </div>
  )
}
